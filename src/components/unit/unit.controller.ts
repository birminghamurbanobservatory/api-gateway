import * as event from 'event-stream';


export async function createUnit(unit): Promise<any> {
  const createdUnit = await event.publishExpectingResponse('unit.create.request',  {
    new: unit
  });
  return createdUnit;
}


export async function getUnit(unitId): Promise<any> {
  const unit = await event.publishExpectingResponse('unit.get.request', {
    where: {
      id: unitId
    }
  }); 
  return unit;
}


export async function getUnits(): Promise<any> {
  const units = await event.publishExpectingResponse('units.get.request'); 
  return units;
}