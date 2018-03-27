angular.module('app')

  .directive('assessment', function($rootScope, $state, $sce, $timeout) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {
        type: '=',
        student: '=',
        assessment: '=',
        edit: '=',
        print: '@'
      },
      templateUrl: 'views/assessment.html',
      link: function($scope, $element, $attrs, $window) {

        $scope.show = false;
        $scope.showAllAssessments = $scope.edit;
        $scope.showChart = true;

        $timeout(function(){
          $scope.link = window.location.href.replace('/admin', '');
        }, 0);

        if ($rootScope.cache.GrowthCalculator == undefined) {
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
            $rootScope.cache.GrowthCalculator = items1;
            $scope.growth = items1;
            $scope.$apply();
          });
        }
        else {
          $scope.growth = $rootScope.cache.GrowthCalculator;
        }

        var calculateQuarters = function(assessment, assessments) {
          var quarters = $scope.quarters;
          var last = 0;
          for (var i=0; i<quarters.length; i++) {

            // This is a hack to support the last quarter showing the first Level of the next year.
            // (for all grades but Kinder)
            var automaticallyAdd = (i == quarters.length - 1 && $scope.student.Grade != 0) ? 1 : 0;

            quarters[i].expectedTextLevel = $rootScope.getExpectedTextLevel($scope.student.Grade, new Date(quarters[i].LastDay), null, automaticallyAdd);

            // Add assessments
            quarters[i].assessment = null;
            for (var j=last; j<assessments.length; j++) {
              if (assessments[j].Date <= quarters[i].LastDay && assessments[j].Mastery !== 'Hard') {
                quarters[i].assessment = assessments[j];
                last = j+1;
              }
            }

          }
          //console.log('quarters', quarters);
          $scope.quarters = quarters;
          $scope.$apply();
          drawChart();
        }

        var getStudents = function(cb, assessment) {
          var studentID = typeof $scope.student === 'string' ? $scope.student : $scope.student.id;
          $rootScope.Airtable('Students').find(studentID, function(err, record) {
            record.fields.id = record.id;
            $scope.student = record.fields;
            $scope.show = $scope.print ? false : true;
            $scope.$apply();

            var assessments = [];
            //var disabledItems = {};
            $rootScope.Airtable('Assessments').select({
              filterByFormula: '{Student} = "' + record.fields.ID + '"',
              sort: [
                {field: 'Date', direction: 'asc'}
              ]
            }).eachPage(function page(records, fetchNextPage) {
              records.forEach(function (record) {
                record.fields.id = record.id;
                assessments.push(record.fields);
              });
              fetchNextPage();
            }, function done(error) {
              $scope.show = assessments.length ? true : false;
              $scope.assessments = assessments;

              if (!assessments.length) {
                $scope.newAssessment();
              }

              // Get the Quarters
              if ($rootScope.cache.Quarters == undefined) {
                var items0 = [];
                $rootScope.Airtable('Quarters').select({
                  sort: [
                    {field: 'Name', direction: 'asc'}
                  ]
                }).eachPage(function page(records0, fetchNextPage0) {
                  records0.forEach(function (record) {
                    record.fields.id = record.id;
                    items0.push(record.fields);
                  });
                  fetchNextPage0();
                }, function done(error) {
                  $rootScope.cache.Quarters = items0;
                  $scope.quarters = items0;
                  $scope.$apply();
                  if (cb) {
                    cb(assessment, assessments);
                  }
                });
              }
              else {
                $scope.quarters = $rootScope.cache.Quarters;
                if (cb) {
                  cb(assessment, assessments);
                }
              }


              $scope.$apply();
            });
          });
        }
        getStudents(calculateQuarters);


        function drawChart() {
          if ($scope.assessments && $scope.quarters) {
            google.charts.load('current', {packages: ['corechart', 'line']});
            google.charts.setOnLoadCallback(drawCurveTypes);
          }

          function drawCurveTypes() {
            var data = new google.visualization.DataTable();
            data.addColumn('date', 'Date');
            data.addColumn('number', 'Reading Level');
            data.addColumn('number', 'Expected');

            // Add expected values, starting with one for the beginning of the year
            data.addRow([
              new Date($scope.quarters[0].LastDay.replace('10', '08')),
              null,
              parseInt($scope.student.Grade)
            ]);
            for (var i=0; i<$scope.quarters.length; i++) {
              data.addRow([
                new Date($scope.quarters[i].LastDay),
                null,
                (i+1)/4 + parseInt($scope.student.Grade)
              ]);
            }

            // Add assessments
            var lastDate = null;
            var rows = [];
            for (i=0; i<$scope.assessments.length; i++) {
              if ($scope.assessments[i].Mastery !== 'Hard' && $scope.assessments[i].Mastery !== 'Placement') {
                var date = new Date($scope.assessments[i].Date);
                var level = $rootScope.getNumericalReadingLevel($scope.assessments[i].TextLevel);
                if (rows.length != 0 && rows[rows.length - 1][0].getTime() === date.getTime()) {
                  rows[rows.length - 1][1] = rows[rows.length - 1][1] > level ? rows[rows.length - 1][1] : level;
                } else {
                  rows.push([
                    date,
                    level,
                    null
                  ]);
                }
              }
            }
            data.addRows(rows);

            var options = {
              // vAxis: {
              //   title: 'Reading Level'
              // },
              series: {
                1: {curveType: 'function'},
                2: {curveType: 'function'}
              },
              'chartArea': {left: 40, top: 10, 'width': '80%', 'height': '90%'},
              'legend': {'position': 'top right'}
            };

            var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
            chart.draw(data, options);
          }
        }

        $scope.toggleAllAssessments = function() {
          $scope.showAllAssessments = !$scope.showAllAssessments;
        }

        $scope.toggleChart = function() {
          $scope.showChart = !$scope.showChart;
        }

        $scope.newAssessment = function() {
          $scope.assessment = {
            Student: [$scope.student],
            Grade: $scope.student.Grade,
            Date: new Date(),
            Genre: 'Fiction',
            TextLevel: '',
            ExpectedTextLevel: '',
            Accuracy: null,
            Comprehension: null,
            Fluency: null,
            Mastery: 'Instructional',
            Closeness: '',
            Notes: ''
          };
          scrollToAssessment();
        }

        $scope.clickAssessment = function(item, e) {
          e.preventDefault();
          if (!$scope.edit) {
            return;
          }
          if ($scope.assessment && item.id == $scope.assessment.id) {
            $scope.assessment = null;
          }
          else {
            for (var j=0; j<$scope.assessments.length; j++) {
              if ($scope.assessments[j].id == item.id) {
                $scope.assessments[j].Date = new Date($scope.assessments[j].Date);
                $scope.assessment = $scope.assessments[j];
              }
            }
          }
          scrollToAssessment();
        }

        function scrollToAssessment() {
          $timeout(function(){
            jQuery('html, body').animate({ scrollTop: jQuery('#assessment').offset().top - 50 }, 500);
          }, 10);
        }

        $scope.updateCloseness = function() {
          $scope.assessment.TextLevel = $scope.assessment.TextLevel.toUpperCase();

          if (!$scope.growth.length || !$scope.assessment.TextLevel || !$scope.assessment.Date || !$scope.assessment.Mastery|| $scope.assessment.Mastery === 'Hard') {
            $scope.assessment.GrowthLevel = null;
            $scope.assessment.Closeness = null;
            $scope.assessment.GradeLevel = null;
            $scope.assessment.ExpectedTextLevel = null;
            return;
          }

          var current = $rootScope.getNumericalReadingLevel($scope.assessment.TextLevel);
          var expectedTextLevel = $rootScope.getExpectedTextLevel($scope.student, new Date($scope.assessment.Date), $scope.assessment.Mastery);
          var expected = $rootScope.getNumericalReadingLevel(expectedTextLevel);

          $scope.assessment.GrowthLevel = current;
          $scope.assessment.Closeness = current - expected;
          $scope.assessment.GradeLevel = Math.floor(current);
          $scope.assessment.ExpectedTextLevel = expectedTextLevel;

        }

        $scope.cancelAssessment = function() {
          $scope.assessment = null;
        }

        $scope.deleteAssessment = function(id) {
          $rootScope.Airtable('Assessments').destroy(id, function(err, record) {
            if (err) { alert('There was a problem deleting this assessment!');console.error(err); return; }
            $scope.assessment = null;
            getStudents(saveAssessmentLoadedCallback, null);
          });
        }



        $scope.saveAssessment = function(assessment) {
          if (assessment.id) {
            var id = assessment.id;
            delete assessment.id;
            delete assessment.ID;
            delete assessment['$$hashKey'];
            //console.log('Update assessment', assessment);
            $rootScope.Airtable('Assessments').update(id, assessment, function(err, record) {
              if (err) { alert('There was a problem saving this assessment!');console.error(err); return; }
              $scope.assessment = null;
              getStudents(saveAssessmentCallback, assessment);
            });
          }
          else {
            assessment.Date = new Date(assessment.Date).toISOString().slice(0, 10);
            assessment.Student[0] = typeof assessment.Student[0] == 'object' ? assessment.Student[0].id : assessment.Student[0];
            //console.log('Create assessment', assessment);
            $rootScope.Airtable('Assessments').create(assessment, function (err, record) {
              if (err) {
                alert('There was a problem saving this assessment!');
                console.log(err);
                return;
              }
              $scope.assessment = null;
              getStudents(saveAssessmentCallback, $scope.assessments);
            });
          }

        }

        var saveAssessmentCallback = function (assessment, assessments) {
          getStudents(saveAssessmentLoadedCallback);
        }

        var saveAssessmentLoadedCallback = function(assessment, assessments) {
          // Get the last non-Hard assessment
          assessments = assessments.length ? assessments : [{
            LastAssessment: '',

          }];
          assessment = assessments.length ? assessments[assessments.length - 1] : assessments[0];
          if (assessment.Mastery === 'Hard' && assessments.length > 1) {
            assessment = assessments[assessments.length - 2];
          }
          if (assessment.Mastery === 'Hard' && assessments.length > 2) {
            assessment = assessments[assessments.length - 3];
          }

          var studentEdit = {};
          studentEdit['LastAssessment'] = assessment.Date !== undefined ? assessment.Date : null;
          studentEdit['Closeness'] = assessment.Closeness !== undefined ? assessment.Closeness : null;
          studentEdit['Accuracy'] = assessment.Accuracy !== undefined ? assessment.Accuracy : null;
          studentEdit['Comprehension'] = assessment.Comprehension !== undefined ? assessment.Comprehension : null;
          studentEdit['Fluency'] = assessment.Fluency !== undefined ? assessment.Fluency : null;
          studentEdit['Notes'] = assessment.Notes !== undefined ? assessment.Notes : null;
          studentEdit['Mastery'] = assessment.Mastery !== undefined ? assessment.Mastery : null;
          studentEdit['TextLevel'] = assessment.TextLevel !== undefined ? assessment.TextLevel : null;
          studentEdit['Genre'] = assessment.Genre !== undefined ? assessment.Genre : null;
          studentEdit['AnnualGrowth'] = assessment.GrowthLevel === undefined || assessment.GrowthLevel === null ? null : assessment.GrowthLevel - assessments[0].GrowthLevel;
          //console.log('saving', studentEdit);
          $rootScope.Airtable('Students').update($scope.student.id, studentEdit, function(err, record) {
            if (err) { console.log(err);alert('There was an error updating the Student profile.  Your assessment was saved properly, but the Last Assessment and Closeness values in the Student List may not be correct.'); return; }
            calculateQuarters(assessment, assessments);
            $scope.assessment = null;
          });

        }





      }
    };
  });



