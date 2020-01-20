
const dictionary: any = {
  includeallpublic: 'includeAllPublic',
  indeployment: 'inDeployment',
  indeployment__in: 'inDeployment__in',
  ishostedby: 'isHostedBy',
  ishostedby__in: 'isHostedBy__in',
  hostedbypath: 'hostedByPath',
  hostedbypath__in: 'hostedByPath__in',
  hostedbypathspecial: 'hostedByPathSpecial',
  hostedbypathspecial__in: 'hostedByPathSpecial__in',
  hasfeatureofinterest: 'hasFeatureOfInterest',
  observedproperty: 'observedProperty',
  resulttime__gt: 'resultTime__gt',
  resulttime__gte: 'resultTime__gte',
  resulttime__lt: 'resultTime__lt',
  resulttime__lte: 'resultTime__lte',
  permanenthost: 'permanentHost',
  permanenthost__isdefined: 'permanentHost__isDefined'
};


// The solution I've taken to allowing case insensitive url query string parameter keys is to manually check each query parameter. If, when lowercased, the parameter key matches one in the dictionary, then we'll add the camelCase equivalent to req.query.
// The downside of this approach is having to keep the dictionary up to date.
// The major plus-side is that the event-stream expects camelCase the versions, and in many cases the query string parameters are passed straight to the event-stream as arguments, therefore we need to make sure they are camelCase. The joi validators can also be kept as camelCase.
export function allowCaseInsensitiveQueryParameters(req, res, next): void {

  Object.keys(req.query).forEach((key): void => {
    const lowerKey = key.toLowerCase();
    if (dictionary[lowerKey]) {
      const camelKey = dictionary[lowerKey];
      if (key !== camelKey) {
        // If the case isn't correct yet
        req.query[camelKey] = req.query[key]; 
        delete req.query[key];
      }
    }

  });

  next();

}