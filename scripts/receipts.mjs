const resultNames = new Set(['SUCCESS','ERROR','UNDETERMINED']);
export function receipt(raw,hash){
 const leaders=raw?.consensus_data?.leader_receipt;
 const leader=Array.isArray(leaders)?leaders[0]:leaders;
 const execution=raw?.execution_result??raw?.txExecutionResultName??leader?.execution_result;
 const status=raw?.status===7||raw?.status==='7'?'FINALIZED':String(raw?.status??raw?.networkStatus??'UNKNOWN');
 const consensus=raw?.result_name??raw?.resultName;
 const address=raw?.to_address??raw?.contractAddress??raw?.txDataDecoded?.contractAddress;
 return {transactionHash:hash,status,executionResult:resultNames.has(execution)?execution:null,
  consensusResult:['MAJORITY_AGREE','AGREE','MAJORITY_DISAGREE'].includes(consensus)?consensus:null,
  contractAddress:/^0x[0-9a-f]{40}$/i.test(address??'')?address:null};
}
export function requireSuccess(raw,hash){const x=receipt(raw,hash);if(x.status!=='FINALIZED'||x.executionResult!=='SUCCESS'||!['MAJORITY_AGREE','AGREE'].includes(x.consensusResult))throw Error('Successful finality not proven');return x;}
export function childProof(raw,hash,{sender,recipient,valueGEN,parentHash}){
 const status=raw?.status===7?'FINALIZED':String(raw?.status);
 if(status!=='FINALIZED'||raw?.error||['ERROR','FAILURE','UNDETERMINED'].includes(raw?.execution_result)||raw?.from_address?.toLowerCase()!==sender.toLowerCase()||raw?.to_address?.toLowerCase()!==recipient.toLowerCase()||BigInt(raw?.value??-1)!==BigInt(valueGEN)*10n**18n||raw?.triggered_by!==parentHash)throw Error('Native child not proven');
 return {hash,status,sender,recipient,valueGEN,parentHash};
}
