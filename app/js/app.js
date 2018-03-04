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
            url: '/admin/students',
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
                $scope.students = data;
                $scope.$apply();
              });

              $scope.query = '';
              $scope.setSort = function(key, e) {
                if (!key) {
                  $scope.order = ['LastAssessment', 'Closeness'];
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
                  alert('Please select at least one student');
                }
              }

            }
          })

        $stateProvider
          .state("studentsChart", {
            url: '/admin/students/chart',
            templateUrl: 'views/students-chart.html',
            // auth: true,
            /*resolve: {
                cards: function ($stateParams, $rootScope, $http) {

                }
            },*/
            controller: function ($scope, $rootScope, $state, $filter, $http) {
              $rootScope.showAdmin = true;
              $scope.query = null;

              var calculate = function(students) {
                if ($scope.query && $scope.query.length) {
                  students = $filter('filter')(students, $scope.query);
                }
                console.log(students);
                var labels = [];
                var data = [];
                var colors = [];
                for (var i=0; i<students.length; i++) {
                  if (students[i].Closeness) {
                    labels.push(students[i].FirstName + ' ' + students[i].LastName);
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
                  {field: 'LastName', direction: 'asc'}
                ]
              }).eachPage(function page(records, fetchNextPage) {
                records.forEach(function (record) {
                  record.fields.id = record.id;
                  data.push(record.fields);
                });

                fetchNextPage();
              }, function done(error) {
                $scope.students = data;
                calculate(data);
                $scope.$apply();
              });

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



