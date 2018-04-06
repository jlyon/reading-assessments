'use strict';

//***************************************

// Main Application

// To get direct links to audio files in Google Drive:
// http://directlink.booogle.net/

//***************************************

angular.module('app', [
  'ui.router',
  'ngAnimate',
  'chart.js'
])

  .run(
    ['$sce', '$timeout', '$rootScope', '$state', '$stateParams',
      function ($sce, $timeout, $rootScope, $state, $stateParams) {

        // It's very handy to add references to $state and $stateParams to the
        // $rootScope
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.cache = {};

        var Airtable = require('airtable');
        $rootScope.Airtable = new Airtable({apiKey: 'keyNIbNk17BU31gT8'}).base('appA1AUk2jnO8Xmzt');

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
          .when('/admin', '/admin/students');

        //.otherwise(token ? '/sites' : '/start');

        //////////////////////////
        // State Configurations //
        //////////////////////////
        $stateProvider
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



