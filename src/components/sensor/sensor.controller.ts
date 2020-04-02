import {permissionsCheck} from '../common/permissions-check';
import {ApiUser} from '../common/api-user.class';
import * as sensorService from './sensor.service';
import {formatSensorForClient, addContextToSensor, addContextToSensors} from './sensor.formatter';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import * as check from 'check-types';
import {concat, uniqBy} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';


export async function createSensor(sensor, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:sensor');

  const createdSensor = await sensorService.createSensor(sensor);
  const sensorForClient = formatSensorForClient(createdSensor);
  const sensorWithContext = addContextToSensor(sensorForClient);
  return sensorWithContext;

}


export async function getSensor(sensorId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:sensor');

  const sensor = await sensorService.getSensor(sensorId);

  if (!hasSuperUserPermission) {
    const deployment = await getDeployment(sensor.inDeployment);
    deploymentLevelCheck(deployment, user);
    // TODO: what if the sensor is hosted on a platform that has been shared with another deployment? Should users of this sharee deployment be able to see the sensor's details?
  }

  const sensorForClient = formatSensorForClient(sensor);
  const sensorWithContext = addContextToSensor(sensorForClient);
  return sensorWithContext;
}


export async function getSensors(where, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:sensor') || user.permissions.includes('admin-all:deployments');

  const deploymentDefined = check.nonEmptyString(where.inDeployment) || (check.nonEmptyObject(where.inDeployment) && check.nonEmptyArray(where.inDeployment.in));

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has access.
  if (deploymentDefined && !hasSuperUserPermission) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [where.inDeployment] : where.inDeployment.in;

    let deploymentLevels;
    if (user.id) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck);
    }

    // If there's no level defined for any of these deployments then throw an error
    deploymentLevels.forEach((deploymentLevel): void => {
      if (!deploymentLevel.level) {
        throw new Forbidden(`You do not have the rights to access sensors from the deployment '${deploymentLevel.deploymentId}'.`);
      }
    });

  }

  //------------------------
  // inDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!deploymentDefined && !hasSuperUserPermission) {

    let usersDeployments = [];
    let publicDeployments = [];
    if (user.id) {
      usersDeployments = await getDeployments({user: user.id});
    }
    publicDeployments = await getDeployments({public: true});
    const combindedDeployments = concat(usersDeployments, publicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');
    if (uniqueDeployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any sensors.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    where.inDeployment = {
      in: deploymentIds
    };

  }

  if (!hasSuperUserPermission) {
    // TODO: if the request was for specific deployment(s) then might want to check the deployment(s) actually exist?
  }

  const sensors = await sensorService.getSensors(where);
  const sensorsForClient = sensors.map(formatSensorForClient);
  const sensorsWithContext = addContextToSensors(sensorsForClient);
  return sensorsWithContext;

}


export async function updateSensor(sensorId: string, updates: any, user: ApiUser): Promise<any> {

  // This is for superusers only
  permissionsCheck(user, 'update:sensor');

  const updatedSensor = await sensorService.updateSensor(sensorId, updates);
  const sensorForClient = formatSensorForClient(updatedSensor);
  const sensorWithContext = addContextToSensor(sensorForClient);
  return sensorWithContext;
}


export async function deleteSensor(sensorId: string, user: ApiUser): Promise<void> {

  // This is for superusers only
  permissionsCheck(user, 'delete:sensor');

  await sensorService.deleteSensor(sensorId);
  return;

}


