import * as event from 'event-stream';


export async function getValueTypes(): Promise<any> {
  const valueTypes = await event.publishExpectingResponse('value-types.get.request'); 
  return valueTypes;
}