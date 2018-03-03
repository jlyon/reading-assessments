'use strict';

angular.module('proudcityService', ['ngResource'])

    .factory('Site', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId',
            {
                'siteId': '@siteId'
            },
            {
                get: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    cache: true
                },
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    isArray: false
                },
                query: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    cache: false,
                    isArray: true
                }
            }
        );
    }])

    .factory('CityEmbedCreate', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/city-embed',
            {
                'siteId': '@siteId'
            },
            {
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                }
            }
        );
    }])

    .factory('SiteBuild', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/build',
            {
                'siteId': '@siteId'
            },
            {
                get: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                }
            }
        );
    }])

    .factory('SiteChecklist', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/checklist',
            {
                'siteId': '@siteId'
            },
            {
                get: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    isArray: true
                }
            }
        );
    }])

    .factory('SiteChecklistItem', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/checklist/:checklistKey',
            {
                'siteId': '@siteId',
                'checklistKey': '@checklistKey'
            },
            {
                update: {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                }
            }
        );
    }])

    .factory('SiteUsers', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/users',
            {
                'siteId': '@siteId'
            },
            {
                query: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    isArray: true
                },
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                },
                remove: {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                }
            }
        );
    }])

    .factory('SitePlugins', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/plugins',
            {
                'siteId': '@siteId'
            },
            {
                query: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    isArray: true
                },
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                },
                remove: {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                }
            }
        );
    }])

    .factory('pcAnalytics', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/analytics',
            {
                'siteId': '@siteId'
            },
            {
                get: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    },
                    cache: true
                }
            }
        );
    }])

    .factory('SiteStripeAccount', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/sites/:siteId/stripe/account',
            {
                'siteId': '@siteId'
            },
            {
                get: {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    }
                },
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    }
                },
                update: {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    }
                }
            }
        );
    }])


    .factory('City', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.cityApiUrl + '/city/:state/:city',
            {
                'state': '@state',
                'city': '@city'
            }
        );
    }])


    .factory('Distro', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/distros/:distro',
            {
                'distro': '@distro'
            },
            {
                query: {
                    method: 'GET',
                    isArray: true,
                    cache: true
                }
            },
            {
                get: {
                    method: 'GET',
                    cache: true
                }
            }
        );
    }])


    .factory('DistroChecklist', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + '/distros/:distro/checklist',
            {
                'distro': '@distro'
            },
            {
                get: {
                    method: 'GET',
                    isArray: true,
                    cache: true
                }
            }
        );
    }])

    .factory('SiteEmbedCode', ['$resource', '$rootScope', function ($resource, $rootScope) {
        return $resource($rootScope.apiUrl + 'sites/city/:state/:city',
            {
                'distro': '@distro'
            },
            {
                save: {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + $rootScope.token
                    }
                }
            }
        );
    }])
