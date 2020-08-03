import {ApiUser} from '../common/api-user.class';
import * as checkService from './check.service';
import * as ck from 'check-types';
import {permissionsCheck} from '../common/permissions-check';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {cloneDeep} from 'lodash';
import {renameProperties} from '../../utils/rename';
import {getSensor} from '../sensor/sensor.service';
import {getObservableProperty} from '../observable-property/observable-property.service';
import {getUnit} from '../unit/unit.service';
import {getFeatureOfInterest} from '../feature-of-interest/feature-of-interest.service';
import {getAggregation} from '../aggregation/aggregation.service';
import {getDiscipline} from '../discipline/discipline.service';
import {getPlatform} from '../platform/platform.service';
import {getProcedure} from '../procedure/procedure.service';
import {createCheckResponse, createChecksResponse} from './check.formatter';
import {CollectionOptions} from '../common/collection-options.class';


export async function createCheck(check, user: ApiUser): Promise<any> {

  const deploymentSpecified = ck.assigned(check.appliesTo.hasDeployment);
  const isSuperUser = user.permissions.includes('crud:checks');

  if (deploymentSpecified && !isSuperUser) {
    // Check the user has sufficient rights to this deployment.
    const deployment = await getDeployment(check.appliesTo.hasDeployment);
    // the following also allows users with admin-all:deployments permission
    deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
  } else {
    // Only superusers can create a a check without a deployment specified.
    permissionsCheck(user, 'crud:checks');
  }

  await checkAppliesToResourcesExist(check.appliesTo);

  const checkToCreate = cloneDeep(check);
  checkToCreate.appliesTo = renameProperties(checkToCreate.appliesTo, {
    ancestorPlatforms: 'hostedByPath',
    ancestorPlatformsIncludes: 'hostedByPathIncludes'
  });

  const createdCheck = await checkService.createCheck(checkToCreate);
  const checkWithContext = createCheckResponse(createdCheck);
  return checkWithContext;

}


export async function getCheck(checkId: string, user: ApiUser): Promise<any> {

  const check = await checkService.getCheck(checkId);

  const deploymentSpecified = ck.assigned(check.appliesTo.hasDeployment);
  const isSuperUser = user.permissions.includes('crud:checks');

  if (deploymentSpecified && !isSuperUser) {
    // Check the user has sufficient rights to this deployment.
    const deployment = await getDeployment(check.appliesTo.hasDeployment);
    // the following also allows users with admin-all:deployments permission
    deploymentLevelCheck(deployment, user); // can be any rights level
  } 

  const checkWithContext = createCheckResponse(check);
  return checkWithContext;

}


export async function getChecks(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const deploymentSpecified = ck.assigned(where.hasDeployment);
  // For checks a user with the admin-all:deployments permission has the same rights as one with crud:checks because all the checks without a specific deployment are public anyway.
  const canAccessAllChecks = user.permissions.includes('crud:checks') || user.permissions.includes('admin-all:deployments');

  if (deploymentSpecified) {
    const deployment = await getDeployment(where.hasDeployment);
    // the following also allows users with admin-all:deployments permission
    deploymentLevelCheck(deployment, user, ['admin', 'engineer']); 
  }

  if (!canAccessAllChecks && !deploymentSpecified) {
    // We'll want to include both checks without a hasDeployment property, and those with a deployment that is public or the user has specific rights to.
    const getDeploymentsWhere: any = {};
    if (user.id) {
      getDeploymentsWhere.user = user.id;
    } else {
      getDeploymentsWhere.public = true;
    }
    const {deployments} = await getDeployments(getDeploymentsWhere);
    const deploymentIds = deployments.map((deployment): string => deployment.id); 
    where.or = [
      {hasDeployment: {exists: false}},
      {hasDeployment: {in: deploymentIds}}
    ];
  }

  const {checks, count, total} = await checkService.getChecks(where, options);
  const checksWithContext = createChecksResponse(checks, {count, total});
  return checksWithContext;

}


export async function deleteCheck(checkId: string, user: ApiUser): Promise<void> {

  const check = await checkService.getCheck(checkId);

  const deploymentSpecified = ck.assigned(check.appliesTo.hasDeployment);
  const isSuperUser = user.permissions.includes('crud:checks');

  if (deploymentSpecified && !isSuperUser) {
    // Check the user has sufficient rights to this deployment.
    const deployment = await getDeployment(check.appliesTo.hasDeployment);
    // the following also allows users with admin-all:deployments permission
    deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
  } else {
    // Only superusers can delete a check without a deployment specified.
    permissionsCheck(user, 'crud:checks');
  }

  await checkService.deleteCheck(checkId);
  return;

}



async function checkAppliesToResourcesExist(appliesTo): Promise<void> {

  const getResourcePromises = [];

  if (appliesTo.madeBySensor) {
    getResourcePromises.push(getSensor(appliesTo.madeBySensor));
  }

  if (appliesTo.observedProperty) {
    getResourcePromises.push(getObservableProperty(appliesTo.observedProperty));
  }

  if (appliesTo.unit) {
    getResourcePromises.push(getUnit(appliesTo.unit));
  }

  if (appliesTo.hasFeatureOfInterest) {
    getResourcePromises.push(getFeatureOfInterest(appliesTo.hasFeatureOfInterest));
  }

  if (appliesTo.hasDeployment) {
    getResourcePromises.push(getDeployment(appliesTo.hasDeployment));
  }

  if (appliesTo.aggregation) {
    getResourcePromises.push(getAggregation(appliesTo.aggregation));
  }

  if (appliesTo.disciplines) {
    appliesTo.disciplines.forEach((discipline): void => {
      getResourcePromises.push(getDiscipline(discipline));
    });
  }

  if (appliesTo.disciplinesIncludes) {
    getResourcePromises.push(getDiscipline(appliesTo.disciplinesIncludes));
  }

  if (appliesTo.ancestorPlatforms) {
    appliesTo.ancestorPlatforms.forEach((platform): void => {
      getResourcePromises.push(getPlatform(platform));
    });
  }

  if (appliesTo.ancestorPlatformsIncludes) {
    getResourcePromises.push(getPlatform(appliesTo.ancestorPlatformsIncludes));
  }

  if (appliesTo.usedProcedures) {
    appliesTo.usedProcedures.forEach((procedure): void => {
      getResourcePromises.push(getProcedure(procedure));
    });
  }

  if (appliesTo.usedProceduresIncludes) {
    getResourcePromises.push(getProcedure(appliesTo.usedProceduresIncludes));
  }
  
  // Any error thrown by this should be pretty meaningful
  await Promise.all(getResourcePromises);

}