export const ongProfilePath = ({ accountId }) => '/ongs/' + accountId;
export const ongAdoptionSearch = ({ name, accountId }) => new URLSearchParams({
  ong: name, ...(accountId && { ongId: accountId }),
}).toString();
