'use strict';

//***************************************

// Main Application

// To get direct links to audio files in Google Drive:
// http://directlink.booogle.net/

//***************************************

angular.module('app', [
  'ui.router',
  'ngAnimate',
  'chart.js',
  'firebase'
])

  .run(
    ['$sce', '$timeout', '$rootScope', '$state', '$stateParams', '$window', '$firebaseAuth',
      function ($sce, $timeout, $rootScope, $state, $stateParams, $window, $firebaseAuth) {

        // It's very handy to add references to $state and $stateParams to the
        // $rootScope
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.cache = {};


        $rootScope.config = {
          years: [
            {
              label: '2018-19',
              base: 'appV6NqAqUOyQvJUW',
              key: 'keyNIbNk17BU31gT8',
              table: 'tblPHmjv1JnCHTSkV'
            },
            {
              label: '2017-18',
              base: 'appA1AUk2jnO8Xmzt',
              key: 'keyNIbNk17BU31gT8',
              table: 'tbluC9NfD8WSZlvZs'
            },
          ],
          admins: [
            'jeff@albatrossdigital.com',
            'lisa.perloff@lighthousecharter.org',
            'virginia.mcmanus@lighthousecharter.org',
            'ana.garcia@lighthousecharter.or',
            'daelana.burrell@lighthousecharter.org',
            'tiffany.do@lighthousecharter.org',
            'maricruz.martinez@lighthousecharter.org',
            'robbie.torney@lighthousecharter.org'
          ],
          default_year: '2018-19'
        }

        // Handle year changing
        $rootScope.activeYear = $window.localStorage.getItem('sightWordsAssessmentYear') ? JSON.parse($window.localStorage.getItem('sightWordsAssessmentYear')) : $rootScope.config.years[0];
        $rootScope.setYear = function(year, e) {
          e.preventDefault();
          $window.localStorage.setItem('sightWordsAssessmentYear', JSON.stringify(year));
          $rootScope.activeYear = year;
          $state.go('students', {reload: true});
          $window.location.href = '/?'+ new Date().getTime() +'#/admin/students';
        }

        // Authentication
        $rootScope.auth = $firebaseAuth();
        var firebaseUser = $window.localStorage.getItem('firebaseUser');
        firebaseUser = firebaseUser ? JSON.parse(firebaseUser) : null;
        $rootScope.firebaseUser = firebaseUser;

        // any time auth state changes, add the user data to scope
        $rootScope.auth.$onAuthStateChanged(function(firebaseUser) {
          firebaseUser = JSON.parse(JSON.stringify(firebaseUser));
          if (!firebaseUser) {
            role = null
          }
          else {
            var role;
            if (firebaseUser && firebaseUser != null && firebaseUser.email && $rootScope.config.admins.indexOf(firebaseUser.email) !== -1) {
              role = 'admin';
            }
            else {
              role = 'student';
            }
            firebaseUser.role = role;
            firebaseUser.time = new Date();
            firebaseUser.providerData = undefined;
          }

          if ($rootScope.firebaseUser != firebaseUser) {
            $rootScope.firebaseUser = firebaseUser;
            $window.localStorage.setItem('firebaseUser', JSON.stringify(firebaseUser));
          }

          if (firebaseUser && $state.current.name === 'login') {
            if (role === 'admin') {
              $state.go('students');
            }
            else {
              $state.go('myFlashcards');
            }
          }
        });

        // Toggle topnav dropdowns
        var resetDropdown = function() {
          $rootScope.dropdown = {
            year: '',
            user: ''
          };
        }
        resetDropdown()

        $rootScope.toggleDropdown = function(key, e) {
          e.preventDefault();
          $rootScope.dropdown[key] = $rootScope.dropdown[key] === 'open' ? '' : 'open';
        }

        // Check login
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
          if (toState.auth) {
            if (!$rootScope.firebaseUser) {
              event.preventDefault();
              $state.go('login', {msg: 'You need to login'});
            }
            if (toState.auth && toState.auth != $rootScope.firebaseUser.role) {
              event.preventDefault();
              $state.go('login', {msg: 'Sorry, you don\'t have access.'});
            }
          }
          resetDropdown();
        });
        $rootScope.logout = function(e) {
          $rootScope.firebaseUser = null;
          $window.localStorage.setItem('firebaseUser', null);
          $rootScope.auth.$signOut();
        }

        // Airtable
        var Airtable = require('airtable');
        $rootScope.Airtable = new Airtable({apiKey: $rootScope.activeYear.key}).base($rootScope.activeYear.base);

        // Get the GrowthCalculator table
        var items1 = [];
        $rootScope.Airtable('GrowthCalculator').select({
          sort: [
            {field: 'ID', direction: 'asc'}
          ]
        }).eachPage(function page(records, fetchNextPage1) {
          records.forEach(function (record) {
            record.fields.id = record.id;
            items1.push(record.fields);
          });
          fetchNextPage1();
        }, function done(error) {
          $rootScope.growth = items1;
        });

        // Helper function turns "C" (etc) into a number
        $rootScope.getNumericalReadingLevel = function(textLevel) {
          var num = 0;
          for (var i=0; i<$rootScope.growth.length; i++) {
            if ($rootScope.growth[i].TextLevel == textLevel) {
              break;
            }
            num += parseFloat($rootScope.growth[i].Growth);
          }
          return num;
        }

        // Helper functions calculates where we are expected to be at a given date
        // formula: {grade level} + {time of year} - {grade level equiv}
        $rootScope.getExpectedTextLevel = function(gradeLevel, date, mastery, automaticallyAdd) {

          // Get % of school-year that is complete
          // Note: months are -1 what you expect so 7 = August, 5 = June
          var now = date;
          var start  = new Date(now.getFullYear(), 7, 14);
          start = start > now ? new Date(now.getFullYear() - 1 , 7, 14) : start;
          var end = new Date(start.getFullYear() + 1, 5, 14);
          var fraction = (now - start)/(end - start);

          var gradeLevels = [];
          var gradeKey = null;
          for (var i=0; i<$rootScope.growth.length; i++) {
            if ($rootScope.growth[i].GradeLevel == Math.floor(gradeLevel)) {
              gradeKey = gradeKey ? gradeKey : i;
              gradeLevels.push($rootScope.growth[i]);
            }
          }

          var key = Math.round(fraction * gradeLevels.length);

          // If Mastery is Hard they are really one step back
          // @todo: is this correct?
          if (mastery != undefined && mastery === 'Hard') {
            key --;
          }

          // This is a hack to support the last quarter showing the first Level of the next year.
          // (for all grades but Kinder)
          if (automaticallyAdd != undefined) {
            key += automaticallyAdd;
          }

          //console.log('fraction', fraction);

          //var foundTextLevel = false;
          var expectedTextLevel = null;
          for (i=0; i<$rootScope.growth.length; i++) {
            var item = $rootScope.growth[i];
            // if (i < gradeKey + key - 1) {
            //   expected += parseFloat(item.Growth);
            // }
            if (i < gradeKey + key) {

              expectedTextLevel = item.TextLevel;
            }
            // if (item.TextLevel == $scope.assessment.TextLevel) {
            //   foundTextLevel = item;
            // }
          }

          return expectedTextLevel;
        };


      }
    ]
  )

  .config(
    ['$locationProvider', '$stateProvider', '$urlRouterProvider',
      function ($locationProvider, $stateProvider, $urlRouterProvider) {



        /////////////////////////////
        // Redirects and Otherwise //
        /////////////////////////////

        // Use $urlRouterProvider to configure any redirects (when) and invalid
        // urls (otherwise).
        $urlRouterProvider
          .when('/admin', '/admin/students')
          .otherwise('/');

        //.otherwise(token ? '/sites' : '/start');

        //////////////////////////
        // State Configurations //
        //////////////////////////
        $stateProvider

          .state("login", {
            url: '/?msg',
            templateUrl: 'views/login.html',
            controller: function ($scope, $rootScope, $state, $filter, $timeout) {
              $scope.clickLogin = function(e) {
                e.preventDefault();
                console.log($state);
                $scope.msg = $state.params.msg;
              }
            }
          })

          .state("students", {
            url: '/admin/students/:query',
            templateUrl: 'views/students.html',
            // auth: true,
            /*resolve: {
                cards: function ($stateParams, $rootScope, $http) {

                }
            },*/
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              $rootScope.showAdmin = true;

              var data = [];
              $rootScope.Airtable('Students').select({
                sort: [
                  {field: 'LastName', direction: 'asc'}
                ]
              }).eachPage(function page(records, fetchNextPage) {
                records.forEach(function (record) {
                  record.fields.id = record.id;
                  data.push(record.fields);
                });

                fetchNextPage();
              }, function done(error) {
                var now = new Date();
                for (var i=0; i<data.length; i++) {
                  var expected = $rootScope.getExpectedTextLevel(data[i].Grade, now);
                  expected = $rootScope.getNumericalReadingLevel(expected);
                  var current = $rootScope.getNumericalReadingLevel(data[i].TextLevel);
                  data[i].Closeness = current - expected;
                  data[i].Copied = data[i].NeedToEnter ? data[i].NeedToEnter : false;
                }
                $scope.students = data;
                $scope.$apply();
              });

              $rootScope.query = $state.params.query;
              $scope.setSort = function(key, e) {
                if (!key) {
                  $scope.order = ['Closeness', 'LastAssessment'];
                  return;
                }
                e.preventDefault();
                key = key.replace(/ /g, '+');
                $scope.order = $scope.order == key ? '-' + key : key;
              }
              $scope.setSort();

              $scope.checkall = false;
              $scope.checkallClick = function() {
                var arr = $filter('filter')($scope.students, $scope.query);
                for (var i=0; i<arr.length; i++) {
                  arr[i].selected = $scope.checkall;
                }
              };
              $scope.print = function() {
                var students = [];
                for (var i=0; i<$scope.students.length; i++) {
                  if ($scope.students[i].selected) {
                    students.push($scope.students[i].id);
                  }
                }
                if (students.length > 10) {
                  if (!confirm("Printing over 10 students at a time doesn't always work.  If you run in to issues, wait one minute, click Back, and refresh the page. \n\n Are you sure you want to continue?")) {
                    return;
                  }
                }
                if (students.length) {
                  $state.go('printAssessment', {students: students.join(',')});
                }
                else {
                  //alert('Please select at least one student');
                }
              }

              $scope.clickNeedToEnter = function(student) {
                var studentEdit = { NeedToEnter: student.NeedToEnter};
                console.log(studentEdit);
                $rootScope.Airtable('Students').update(student.id, studentEdit, function(err, record) {
                  if (err) { console.log(err);alert('There was an error updating the Student profile.'); return; }
                });
              }

            }
          })

        $stateProvider
          .state("studentsChart", {
            url: '/admin/chart/:query',
            templateUrl: 'views/students-chart.html',
            // auth: true,
            /*resolve: {
                cards: function ($stateParams, $rootScope, $http) {

                }
            },*/
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              $rootScope.showAdmin = true;
              $rootScope.query = $state.params.query;

              var calculate = function(students) {
                if ($scope.query && $scope.query.length) {
                  students = $filter('filter')(students, $scope.query);
                }
                var labels = [];
                var data = [];
                var colors = [];
                for (var i=0; i<students.length; i++) {
                  if (students[i].Closeness != null) {
                    labels.push(students[i].FirstName + ' ' + students[i].LastName + ' ' + students[i].LastAssessment);
                    data.push(students[i].Closeness);
                    colors.push(students[i].Closeness < 0 ? '#f7464a' : '#3c763d'); // red : green
                  }
                }

                $scope.labels = labels;
                $scope.data = data;
                $scope.colors = colors;
              }

              var data = [];
              $rootScope.Airtable('Students').select({
                sort: [
                  {field: 'LastAssessment', direction: 'asc'}
                ]
              }).eachPage(function page(records, fetchNextPage) {
                records.forEach(function (record) {
                  record.fields.id = record.id;
                  data.push(record.fields);
                });

                fetchNextPage();
              }, function done(error) {
                var now = new Date();
                for (var i=0; i<data.length; i++) {
                  var expected = $rootScope.getExpectedTextLevel(data[i].Grade, now);
                  expected = $rootScope.getNumericalReadingLevel(expected);
                  var current = $rootScope.getNumericalReadingLevel(data[i].TextLevel);
                  data[i].Closeness = precisionRound(current - expected, 2);
                  data[i].Copied = data[i].NeedToEnter ? data[i].NeedToEnter : false;
                }
                $scope.students = data;
                calculate(data);
                $scope.$apply();
              });

              var precisionRound = function(number, precision) {
                var factor = Math.pow(10, precision);
                return Math.round(number * factor) / factor;
              }



              $scope.updateQuery = function() {
                calculate($scope.students, $scope.query);
              }
            }
          })

          .state("editAssessment", {
            url: '/admin/student/:student',
            template: '<div assessment edit="true" type="type" student="student"></div>',
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              $rootScope.showAdmin = true;
              $scope.type = $state.params.type;
              $scope.student = $state.params.student;
            }
          })

          .state("viewAssessment", {
            url: '/student/:student',
            template: '<div assessment type="type" student="student"></div>',
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              $scope.type = $state.params.type;
              $scope.student = $state.params.student;
            }
          })

          .state("printAssessment", {
            url: '/print/:students',
            templateUrl: 'views/print.html',
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              var students = $state.params.students.split(',');
              $scope.total = students.length;
              $scope.words = 'words';
              $scope.letters = 'letters';
              $scope.students = students;
              /*
              $scope.students = [];
              $scope.loading = true;
              var timeout = function() {
                if (students.length) {
                  $scope.progress = $scope.total - students.length;
                  var student = students.pop()
                  $scope.students.push(student);
                  setTimeout(timeout, 3000);
                }
                else {
                  $scope.loading = false;
                  $scope.$apply();
                }
              }
              timeout();
              */
            }
          })

      }
    ]
  );



