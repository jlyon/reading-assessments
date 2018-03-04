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

        // if ($rootScope.cache[$scope.type + ' Groups'] == undefined) {
        //   var groups = [];
        //   $rootScope.Airtable($scope.type + ' Groups').select({
        //     sort: [
        //       {field: 'Order', direction: 'asc'}
        //     ]
        //   }).eachPage(function page(records, fetchNextPage) {
        //     records.forEach(function (record) {
        //       record.fields.id = record.id;
        //       groups.push(record.fields);
        //     });
        //     fetchNextPage();
        //   }, function done(error) {
        //     $rootScope.cache[$scope.type + ' Groups'] = groups;
        //     $scope.groups = groups;
        //     $scope.$apply();
        //   });
        // }
        // else {
        //   $scope.groups = $rootScope.cache[$scope.type + ' Groups'];
        // }

        var calculateQuarters = function(assessment, assessments) {
          var quarters = $scope.quarters;
          var last = 0;
          for (var i=0; i<quarters.length; i++) {
            for (var j=last; j<assessments.length; j++) {
              console.log(assessments[j].Date, quarters[i].LastDay)
              if (assessments[j].Date <= quarters[i].LastDay) {
                quarters[i].assessment = assessments[j];
                last = i+1;
              }
            }
          }
          $scope.quarters = quarters;
          $scope.$apply();
          console.log('quarters', quarters);
        }

        var getStudents = function(cb, assessment) {
          var studentID = typeof $scope.student === 'string' ? $scope.student : $scope.student.id;
          $rootScope.Airtable('Students').find(studentID, function(err, record) {
            record.fields.id = record.id;
            $scope.student = record.fields;
            $scope.show = $scope.print ? false : true;
            $scope.$apply();

            var assessments = [];
            var disabledItems = {};
            var sum = 0;
            $rootScope.Airtable('Assessments').select({
              filterByFormula: '{Student} = "' + record.fields.ID + '"',
              sort: [
                {field: 'Date', direction: 'asc'}
              ]
            }).eachPage(function page(records, fetchNextPage) {
              records.forEach(function (record) {
                record.fields.id = record.id;
                sum += record.fields.Items ? record.fields.Items.length : 0;
                record.fields.sum = sum;
                assessments.push(record.fields);
              });
              fetchNextPage();
            }, function done(error) {
              $scope.show = assessments.length ? true : false;
              $scope.assessments = assessments;

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




        // $scope.linkClick = function ($event) {
        //   $event.target.select();
        // };
        //
        // $scope.toggleWord = function(word) {
        //   var index = $scope.assessment.Items.indexOf(word);
        //   if (index != -1) {
        //     $scope.assessment.Items.splice(index, 1);
        //   }
        //   else {
        //     $scope.assessment.Items.push(word);
        //   }
        //   //$scope.$apply();
        // }
        //
        // $scope.setColor = function(color) {
        //   $scope.assessment.Color[0] = color.id;
        //   $scope.activeColor = color;
        // }

        $scope.newAssessment = function() {
          $scope.assessment = {
            Student: [$scope.student],
            Grade: $scope.student.Grade,
            Date: new Date(),
            Type: 'Fiction',
            TextLevel: '',
            ExpectedTextLevel: '',
            Accuracy: '',
            Comprehension: '',
            Fluency: '',
            Mastery: 'Hard',
            Closeness: '',
            Notes: ''
          };
        }

        $scope.clickAssessment = function(item, e) {
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
                for (var i=0; i<$scope.colors.length; i++) {
                  if ($scope.colors[i].id == $scope.assessment.Color[0]) {
                    $scope.setColor($scope.colors[i]);
                  }
                }
              }
            }
          }
        }


        $scope.updateCloseness = function() {
          $scope.assessment.TextLevel = $scope.assessment.TextLevel.toUpperCase();

          if (!$scope.growth.length || !$scope.assessment.TextLevel || !$scope.assessment.Date) {
            return;
          }

          // Get % of school-year that is complete
          // Note: months are -1 what you expect so 7 = August, 5 = June
          var now = new Date($scope.assessment.Date);
          var start  = new Date(now.getFullYear(), 7, 14);
          start = start > now ? new Date(now.getFullYear() - 1 , 7, 14) : start;
          var end = new Date(start.getFullYear() + 1, 5, 14);
          var fraction = (now - start)/(end - start);

          var gradeLevels = [];
          var gradeKey = null;
          for (var i=0; i<$scope.growth.length; i++) {
            if ($scope.growth[i].GradeLevel == $scope.student.Grade) {
              gradeKey = gradeKey ? gradeKey : i;
              gradeLevels.push($scope.growth[i])
            }
          }

          var key = Math.round(fraction * gradeLevels.length);
          console.log('fraction', fraction);
          console.log('key', key, gradeKey);

          var expected = 0;
          var current = 0;
          var foundTextLevel = false;
          console.log($scope.growth);
          for (i=0; i<$scope.growth.length; i++) {
            var item = $scope.growth[i];
            if (i < gradeKey + key) {
              console.log(i, item.Growth);
              expected += parseFloat(item.Growth);
              $scope.assessment.ExpectedTextLevel = item.TextLevel;
            }
            if (!foundTextLevel) {
              current += parseFloat(item.Growth);
            }
            if (item.TextLevel == $scope.assessment.TextLevel) {
              foundTextLevel = true;
            }
          }

          $scope.assessment.Closeness = current - expected;
          $scope.assessment.GradeLevel = Math.floor(current);

          console.log('expected', expected, current);

          console.log(gradeLevels);
          //
          // var gradeLevels = [];
          // var expected = 0;
          // var current = 0;
          // while (var i < $scope.growth.length && var grade <= $scope.student.Grade) {
          //   var item = $scope.growth[i];
          //   if (item.GradeLevel === $scope.student.Grade) {
          //     gradeLevels.push($scope.growth[i])
          //   }
          // }

          //for (var i=0; i<)

          console.log(start, end);
          console.log();


          console.log();
        }

        $scope.cancelAssessment = function() {
          $scope.assessment = null;
        }

        $scope.saveAssessment = function(assessment) {
          // if (!assessment.Color || !assessment.Color[0]) {
          //   alert('You must select a color');
          //   return false;
          // }
          if (assessment.id) {
            var id = assessment.id;
            delete assessment.id;
            delete assessment.ID;
            delete assessment['$$hashKey'];
            console.log('Update assessment', assessment);
            $rootScope.Airtable('Assessments').update(id, assessment, function(err, record) {
              if (err) { alert('There was a problem saving this assessment!');console.error(err); return; }
              $scope.assessment = null;
              getStudents(saveAssessmentCallback, assessment);
            });
          }
          else {
            assessment.Date = new Date(assessment.Date).toISOString().slice(0, 10);
            assessment.Student[0] = typeof assessment.Student[0] == 'object' ? assessment.Student[0].id : assessment.Student[0];
            console.log('Create assessment', assessment);
            $rootScope.Airtable('Assessments').create(assessment, function (err, record) {
              if (err) {
                alert('There was a problem saving this assessment!');
                console.log(err);
                return;
              }
              $scope.assessment = null;
              getStudents(saveAssessmentCallback, assessment);
            });
          }

        }

        var saveAssessmentCallback = function (assessment, assessments) {
          var studentEdit = {};
          studentEdit['LastAssessment'] = assessment.Date;
          var last = assessments.pop();
          studentEdit['LastAssessment'] = assessment.Date;
          studentEdit['Closeness'] = assessment.Closeness;
          studentEdit['Accuracy'] = assessment.Accuracy;
          studentEdit['Comprehension'] = assessment.Comprehension;
          studentEdit['Fluency'] = assessment.Fluency;
          studentEdit['Mastery'] = assessment.TextLevel + '/' + assessment.Mastery + '/' + assessment.Type;
          $rootScope.Airtable('Students').update($scope.student.id, studentEdit, function(err, record) {
            if (err) { console.log(err); return; }
            $scope.assessment = null;
            getStudents(calculateQuarters);
          });
        }





      }
    };
  });



