import {ApiUser} from '../common/api-user.class';
import {createTimeseriesObservationsResponse} from './timeseries-obs.formatter';
import * as check from 'check-types';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {PaginationOptions} from '../common/pagination-options.class';
import * as logger from 'node-logger';
import {getObservations} from '../observation/observation.service';
import {getSingleTimeseries} from '../timeseries/timeseries.service';



export async function getTimeseriesObservations(timeseriesId: string, where, options: PaginationOptions, user: ApiUser): Promise<any> {

  logger.debug(`Getting observations for timeseries: ${timeseriesId}`);

  const updatedWhere: any = cloneDeep(where);

  const canAccessAllObservations = user.permissions.includes('get:observation');
  const canAccessAllDeploymentObservations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');

  if (!canAccessAllObservations) {

    const timeseries = await getSingleTimeseries(timeseriesId);

    if (check.not.nonEmptyArray(timeseries.inDeployments)) {
      throw new Forbidden('You are not permitted to get a observations from a timeseries that does not have inDeployments specified.');
    }

    if (!canAccessAllDeploymentObservations) {
      // Check the user has rights to at least on of the timeseries's deployments
      let deploymentLevels;
      if (user.id) {
        // N.b. this should error if any of the deployments don't exist
        deploymentLevels = await getLevelsForDeployments(timeseries.inDeployments, user.id);
      } else {
        deploymentLevels = await getLevelsForDeployments(timeseries.inDeployments);
      }
      const hasRightsToAtLeastOneDeployment = deploymentLevels.some((deploymentLevel): boolean => {
        return Boolean(deploymentLevel.level);
      });
      if (!hasRightsToAtLeastOneDeployment) {
        throw new Forbidden('You must have rights to at least one of deployments listed for this timeseries');
      }
    }

  }

  // We're simply making an observations request, but with a specific timeseries specified.
  updatedWhere.timeseriesId = timeseriesId;
  // TODO: Might want to make it so that the observations-manager only gets the columns we'll actually use needs from the database, so that we're not only reducing the amount of data sent from the api-gateway to the user, but also from the database to the observations manager and then onto the api-gateway. E.g. add a boolean option called 'condense'.
  const {observations, meta} = await getObservations(updatedWhere, options);

  const observationsWithContext = createTimeseriesObservationsResponse(observations, timeseriesId, meta);
  return observationsWithContext;


}