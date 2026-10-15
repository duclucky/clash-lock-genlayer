import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
export interface Provider { request(args: { method: string; params?: unknown[] }): Promise<unknown>; on?(name: string, fn: (...args: unknown[]) => void): void; removeListener?(name: string, fn: (...args: unknown[]) => void): void; }
export interface DetectedWallet { id: string; name: string; provider: Provider; }
type Injected = Provider & { providers?: Injected[]; isMetaMask?: boolean; isRabby?: boolean; isCoinbaseWallet?: boolean; isBraveWallet?: boolean; isOkxWallet?: boolean };
declare global { interface Window { ethereum?: Injected; okxwallet?: Injected; rabby?: Injected; coinbaseWalletExtension?: Injected; } }
export function discoverWallets(add: (wallet: DetectedWallet) => void): () => void {
  const receive = (event: Event) => { const d = (event as CustomEvent<{ info?: { uuid?: string; name?: string }; provider?: Provider }>).detail; if (d?.provider?.request && d.info?.uuid && d.info?.name) add({ id: d.info.uuid, name: d.info.name, provider: d.provider }); };
  window.addEventListener('eip6963:announceProvider', receive); window.dispatchEvent(new Event('eip6963:requestProvider'));
  const injected = [ ...(window.ethereum?.providers ?? (window.ethereum ? [window.ethereum] : [])), window.okxwallet, window.rabby, window.coinbaseWalletExtension ];
  injected.forEach((provider, i) => { if (provider?.request) add({ id: `injected-${i}`, name: provider.isOkxWallet || provider === window.okxwallet ? 'OKX Wallet' : provider.isRabby ? 'Rabby' : provider.isCoinbaseWallet ? 'Coinbase Wallet' : provider.isBraveWallet ? 'Brave Wallet' : provider.isMetaMask ? 'MetaMask' : 'Browser EVM wallet', provider }); });
  return () => window.removeEventListener('eip6963:announceProvider', receive);
}
export async function ensureChain(provider: Provider) {
  const chain = await provider.request({ method: 'eth_chainId' });
  if (typeof chain === 'string' && Number(BigInt(chain)) === 61999) return;
  try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xf22f' }] }); }
  catch (e) { const code = (e as { code?: number }).code; if (![4902, -32603].includes(code ?? 0)) throw e;
    await provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0xf22f', chainName: 'GenLayer Studionet', nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 }, rpcUrls: ['https://studio.genlayer.com/api'], blockExplorerUrls: ['https://explorer-studio.genlayer.com'] }] });
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xf22f' }] });
  }
  const actual = await provider.request({ method: 'eth_chainId' });
  if (typeof actual !== 'string' || Number(BigInt(actual)) !== 61999) throw new Error('Switch the selected wallet to Studionet before continuing.');
}
interface WalletState { account?: string; provider?: Provider; connect(): void; disconnect(): void; }
const Context = createContext<WalletState>({ connect() {}, disconnect() {} });
export const useWallet = () => useContext(Context);
export function WalletContext({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]), [selected, setSelected] = useState<DetectedWallet>(), [account, setAccount] = useState<string>(), [open, setOpen] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const modal = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLElement | null>(null);
  useEffect(() => discoverWallets(w => setWallets(items => items.some(x => x.provider === w.provider || x.id === w.id || x.name === w.name) ? items : [...items, w])), []);
  useEffect(() => { if (open) { trigger.current = document.activeElement as HTMLElement; modal.current?.showModal(); } else { modal.current?.close(); trigger.current?.focus(); } }, [open]);
  const disconnect = () => { try { sessionStorage.removeItem('clashlock.wallet'); } catch {} setSelected(undefined); setAccount(undefined); setError(''); };
  const restoring = useRef<string | undefined>(undefined);
  useEffect(() => {
    let live = true, remembered: string | null = null;
    try { remembered = sessionStorage.getItem('clashlock.wallet'); } catch {}
    const previous = wallets.find(w => w.name === remembered);
    if (!previous || selected || restoring.current === previous.name) return;
    restoring.current = previous.name;
    void (async () => { try {
      const accounts = await previous.provider.request({method:'eth_accounts'});
      const chain = await previous.provider.request({method:'eth_chainId'});
      if (live && Array.isArray(accounts) && /^0x[0-9a-f]{40}$/i.test(accounts[0]) && chain === '0xf22f') { setSelected(previous); setAccount(accounts[0]); }
    } catch {} })();
    return () => { live = false; restoring.current = undefined; };
  }, [wallets, selected]);
  useEffect(() => { if (!selected) return; const changed = () => disconnect(); selected.provider.on?.('accountsChanged', changed); selected.provider.on?.('chainChanged', changed); selected.provider.on?.('disconnect', changed); return () => { selected.provider.removeListener?.('accountsChanged', changed); selected.provider.removeListener?.('chainChanged', changed); selected.provider.removeListener?.('disconnect', changed); }; }, [selected]);
  async function choose(w: DetectedWallet) { let stage = 'account access'; setBusy(true); setError(''); try { const accounts = await w.provider.request({ method: 'eth_requestAccounts' }); if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) throw new Error('This wallet did not return a valid account.'); stage = 'network selection'; await ensureChain(w.provider); setSelected(w); setAccount(accounts[0]); try { sessionStorage.setItem('clashlock.wallet',w.name); } catch {} setOpen(false); } catch (failure) { const code = (failure as {code?:number}).code; setError(`Wallet ${stage} was not completed${Number.isInteger(code)?` (code ${code})`:''}. Check your wallet and try again.`); } finally { setBusy(false); } }
  return <Context value={{ account, provider: selected?.provider, connect: () => { setError(''); setOpen(true); }, disconnect }}>{children}<dialog ref={modal} onCancel={() => setOpen(false)} aria-labelledby="wallet-title"><div className="modal-head"><span className="eyebrow">YOUR WALLET, YOUR CHOICE</span><button className="plain" onClick={() => setOpen(false)} aria-label="Close wallet selection">×</button></div><h2 id="wallet-title">Connect a wallet</h2><p>Choose an installed EVM wallet. You stay in control of every signature.</p><div className="wallet-list">{wallets.length ? wallets.map(w => <button key={w.id} disabled={busy} className="wallet-option" onClick={() => void choose(w)}>{w.name}<span aria-hidden="true">↗</span></button>) : <p className="notice">No EVM wallet was detected. Open this app in a browser with your wallet extension enabled.</p>}</div>{error && <p role="alert" className="error">{error}</p>}<p className="small">Network: Studionet · deposits are denominated in GEN.</p></dialog></Context>;
}
