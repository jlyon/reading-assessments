angular.module('311AppParent').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/assessment.html',
    "<!--<div ng-if=\"colors && items && assessments\">--><div class=\"assessment-wrapper\"><h2 ng-if=\"student.FirstName\">{{student['FirstName']}} {{student['LastName']}}'s Reading Assessments <small>{{student.Crew}}, {{student.Grade == 0 ? 'K' : student.Grade}}</small></h2><div class=\"form-group row no-print\" ng-if=\"edit\"><div class=\"col-sm-12\"><div class=\"input-group\" style=\"max-width: 500px\"><span class=\"input-group-addon\" id=\"basic-addon1\"><i class=\"fa fa-fw fa-link\"></i></span> <input type=\"text\" class=\"form-control\" aria-describedby=\"basic-addon1\" ng-model=\"link\" ng-click=\"linkClick($event)\"></div></div></div><h3>At a Glance</h3><img src=\"images/grade-level-chart.png\" class=\"grade-level-chart\" alt=\"Grade level vs text level chart\"><table ng-if=\"assessments.length\" class=\"table table-striped quarters\"><thead><tr><th>Quarter</th><th>Level</th><th>Expected</th><th>Grade Band</th><th>Growth</th></tr></thead><tbody><tr ng-repeat=\"item in quarters\"><td>{{item.Name}}</td><td>{{item.assessment.TextLevel}}</td><td>{{item.expectedTextLevel}}</td><td>{{item.assessment.GradeLevel === 0 ? 'K' : item.assessment.GradeLevel}}</td><td><span ng-if=\"item.assessment.GrowthLevel\">{{item.assessment.GrowthLevel - assessments[0].GrowthLevel | number:2}}</span></td></tr></tbody></table><hr><div ng-class=\"showChart ? '' : 'hidden'\"><button class=\"btn btn-default pull-right no-print\" ng-click=\"toggleChart()\"><i class=\"fa fa-fw fa-times\"></i>Hide</button><h3>Reading Progress</h3><div class=\"reading-progress-chart-wrapper\"><div id=\"chart_div\" class=\"reading-progress-chart\"></div></div><hr></div><div ng-if=\"showAllAssessments\"><button class=\"btn btn-default pull-right no-print\" ng-click=\"toggleAllAssessments()\"><i class=\"fa fa-fw fa-times\"></i>Hide</button><h3>All Assessments</h3><p ng-if=\"!assessments.length\">No assessments have been created for {{student['FirstName']}} {{student['LastName']}}.</p><table ng-if=\"assessments.length\" class=\"table table-striped\"><thead><tr><th>Date</th><th>Level</th><th>Expected</th><th>Genre</th><th>Mastery</th><th ng-if=\"edit\" class=\"no-print\">Accuracy</th><th ng-if=\"edit\" class=\"no-print\">Comp.</th><th ng-if=\"edit\" class=\"no-print\">Fluency</th><th>Closeness</th><th>Growth</th><th class=\"hidden-xs-down no-print\">Notes</th></tr></thead><tbody><tr ng-repeat=\"item in assessments\"><td><a href=\"#\" ng-click=\"clickAssessment(item, $event)\" title=\"Edit Assessment\">{{item.Date | date:'MMMM d yyyy'}}</a></td><td>{{item.TextLevel}}</td><td>{{item.ExpectedTextLevel}}</td><td>{{item.Genre}}</td><td>{{item.Mastery}}</td><td ng-if=\"edit\" class=\"no-print\"><span ng-if=\"item.Accuracy\">{{item.Accuracy}}%</span></td><td ng-if=\"edit\" class=\"no-print\">{{item.Comprehension}}</td><td ng-if=\"edit\" class=\"no-print\">{{item.Fluency}}</td><td><strong ng-class=\"item.Closeness >= 0 ? 'text-success' : 'text-danger'\">{{item.Closeness | number:2}}</strong></td><td class=\"hidden-xs-down\"><span ng-if=\"item.GrowthLevel\">{{item.GrowthLevel - assessments[0].GrowthLevel | number:2}}</span></td><td class=\"hidden-xs-down no-print\">{{item.Notes}}</td></tr></tbody></table></div><p class=\"no-print\"><button ng-if=\"!showChart\" class=\"btn btn-default\" ng-click=\"toggleChart()\"><i class=\"fa fa-fw fa-line-chart\"></i>Show Chart</button> <button ng-if=\"!showAllAssessments\" class=\"btn btn-default\" ng-click=\"toggleAllAssessments()\"><i class=\"fa fa-fw fa-info-circle\"></i>See All Assessments</button> <button ng-if=\"!assessment && edit\" class=\"btn btn-primary\" ng-click=\"newAssessment()\"><i class=\"fa fa-fw fa-plus-circle\"></i>Create New Assessment</button></p><div ng-if=\"assessment.Date\" class=\"assessment-form\"><form class=\"assessment no-print\" id=\"assessment\"><hr><h3 ng-if=\"!assessment.id\">Create New Assessment</h3><h3 ng-if=\"assessment.id\">Edit Assessment</h3><hr><div class=\"form-group row\"><label class=\"col-sm-2 col-form-label\">Student</label><div class=\"col-sm-10\">{{student['FirstName']}} {{student['LastName']}}</div></div><div class=\"form-group row\"><label class=\"col-sm-2 col-form-label\">Grade Level</label><div class=\"col-sm-10\">{{student['Grade']}}</div></div><div class=\"form-group row\"><label for=\"date\" class=\"col-sm-2 col-form-label\">Date</label><div class=\"col-sm-10\"><input id=\"date\" type=\"date\" class=\"form-control\" ng-model=\"assessment.Date\" required></div></div><hr><div class=\"form-group row\"><label for=\"type\" class=\"col-sm-2 col-form-label\">Genre</label><div class=\"col-sm-10\"><select class=\"form-control\" ng-model=\"assessment.Genre\" id=\"type\" required><option>Fiction</option><option>Non-fiction</option><option value=\"\">N/A</option></select></div></div><div class=\"form-group row\"><label for=\"level\" class=\"col-sm-2 col-form-label\">Text Level</label><div class=\"col-sm-10\"><input id=\"level\" type=\"text\" class=\"form-control\" ng-model=\"assessment.TextLevel\" ng-change=\"updateCloseness()\"></div></div><div class=\"form-group row\"><label for=\"Mastery\" class=\"col-sm-2 col-form-label\">Mastery</label><div class=\"col-sm-10\"><select class=\"form-control\" ng-model=\"assessment.Mastery\" id=\"Mastery\" ng-change=\"updateCloseness()\"><option>Independent</option><option>Instructional</option><option>Hard</option><option>Placement</option></select></div></div><div class=\"form-group row\"><label for=\"Closeness\" class=\"col-sm-2 col-form-label\">Grade-level Closeness</label><div class=\"col-sm-10\"><div ng-class=\"assessment.Closeness >= 0 ? 'text-success' : 'text-danger'\"><strong>{{assessment.Closeness | number:2}}</strong></div><div ng-if=\"assessment.ExpectedTextLevel\"><div>Current: {{assessment.TextLevel}}</div><div>Expected: {{assessment.ExpectedTextLevel}}</div></div></div></div><hr><div class=\"form-group row\"><label for=\"Accuracy\" class=\"col-sm-2 col-form-label\">Accuracy</label><div class=\"col-sm-10\"><div class=\"input-group\"><input type=\"number\" class=\"form-control\" ng-model=\"assessment.Accuracy\" id=\"Accuracy\"> <span class=\"input-group-addon\" id=\"Accuracy-addon\">%</span></div></div></div><div class=\"form-group row\"><label for=\"Comprehension\" class=\"col-sm-2 col-form-label\">Comprehension</label><div class=\"col-sm-10\"><input type=\"number\" class=\"form-control\" ng-model=\"assessment.Comprehension\" id=\"Comprehension\"></div></div><div class=\"form-group row\"><label for=\"Fluency\" class=\"col-sm-2 col-form-label\">Fluency</label><div class=\"col-sm-10\"><input type=\"number\" class=\"form-control\" ng-model=\"assessment.Fluency\" id=\"Fluency\"></div></div><hr><div class=\"form-group row\"><label for=\"Notes\" class=\"col-sm-2 col-form-label\">Notes</label><div class=\"col-sm-10\"><textarea class=\"form-control\" ng-model=\"assessment.Notes\" id=\"Notes\"></textarea></div></div><hr><div class=\"form-group row\"><label for=\"\" class=\"col-sm-2 col-form-label\"></label><div class=\"col-sm-10\"><button class=\"btn btn-primary\" ng-click=\"saveAssessment(assessment)\"><i class=\"fa fa-fw fa-floppy-o\"></i>Save</button> <button ng-if=\"assessment.id\" class=\"btn btn-danger\" ng-click=\"deleteAssessment(assessment.id)\"><i class=\"fa fa-fw fa-trash\"></i>Delete</button> <button class=\"btn\" ng-click=\"cancelAssessment()\">Cancel</button></div></div></form></div></div>"
  );


  $templateCache.put('views/print.html',
    "<div class=\"print\"><div class=\"alert alert-info no-print\" role=\"alert\"><h1 ng-class=\"loading ? '' : 'force-no-print'\" class=\"no-print\"><i class=\"fa fa-fw fa-spinner fa-spin\"></i>Loading {{total}} students...</h1><div ng-class=\"loading ? 'force-no-print' : ''\"><p>This will print Words and Letters reports for {{total}} students and will require at most <strong>{{total*2}}</strong> sheets of paper</p><p><button onclick=\"window.print()\" class=\"btn btn-primary\"><i class=\"fa fa-fw fa-print\"></i>Print all</button></p></div></div><div ng-repeat=\"student in students\"><div assessment type=\"words\" student=\"student\" print=\"true\"></div><div assessment type=\"letters\" student=\"student\" print=\"true\"></div></div></div>"
  );


  $templateCache.put('views/students-chart.html',
    "<form class=\"form-inline\"><div class=\"form-group\"><div class=\"input-group\"><span class=\"input-group-addon\" id=\"query-addon\"><i class=\"fa fa-fw fa-search\"></i></span> <input class=\"form-control\" ng-model=\"query\" placeholder=\"Student Name or Crew\" ng-change=\"updateQuery()\"></div><span ng-if=\"query\">&nbsp;<strong>{{data.length}}</strong> students matching \"{{query}}\"</span></div></form><hr><h2 class=\"text-center\">Student Closeness</h2><canvas id=\"base\" class=\"chart-horizontal-bar\" chart-data=\"data\" chart-labels=\"labels\" chart-colors=\"colors\" height=\"300\"></canvas>"
  );


  $templateCache.put('views/students.html',
    "<form class=\"form-inline\"><!--\n" +
    "  <div class=\"form-group no-print\">\n" +
    "    <button class=\"btn btn-primary\" ng-click=\"print()\"><i class=\"fa fa-fw fa-print\"></i>Print Selected</button>\n" +
    "  </div>\n" +
    "  --><div class=\"form-group\"><div class=\"input-group\"><span class=\"input-group-addon\" id=\"query-addon\"><i class=\"fa fa-fw fa-search\"></i></span> <input class=\"form-control\" ng-model=\"query\" placeholder=\"Student Name or Crew\"></div><button class=\"btn btn-default no-print\" ng-click=\"setSort()\" title=\"Reset Sort\"><i class=\"fa fa-fw fa-sort-numeric-asc\"></i></button></div></form><hr class=\"no-print\"><table class=\"table table-striped\"><thead><tr><!--<th><input type=\"checkbox\" ng-model=\"checkall\" ng-click=\"checkallClick()\"></th>--><th><a ng-click=\"setSort('LastName', $event)\" href=\"#\">Name</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('ReadingTeacher', $event)\" href=\"#\">Teacher</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('ReadingGroup', $event)\" href=\"#\">Group</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Crew', $event)\" href=\"#\">Crew</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Closeness', $event)\" href=\"#\">Closeness</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('AnnualGrowth', $event)\" href=\"#\">Growth</a></th><th><a ng-click=\"setSort('LastAssessment', $event)\" href=\"#\">Last Assessment</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Level', $event)\" href=\"#\">Level</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Genre', $event)\" href=\"#\">Genre</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Mastery', $event)\" href=\"#\">Mastery</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Accuracy', $event)\" href=\"#\">Accuracy</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Comprehension', $event)\" href=\"#\">Comp.</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Fluency', $event)\" href=\"#\">Fluency</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('Notes', $event)\" href=\"#\">Notes</a></th><th class=\"hidden-xs-down\"><a ng-click=\"setSort('NeedToEnter', $event)\" href=\"#\">Need to Enter</a></th></tr></thead><tbody><tr ng-repeat=\"student in students | filter: query | orderBy: order\"><!--<td><input type=\"checkbox\" ng-model=\"student.selected\"></td>--><td><a ui-sref=\"editAssessment({student: student.id})\">{{student['LastName']}}, {{student['FirstName']}}</a></td><td class=\"hidden-xs-down\">{{student.ReadingTeacher}}</td><td class=\"hidden-xs-down\">{{student.ReadingGroup}}</td><td class=\"hidden-xs-down\">{{student.Crew}}</td><td class=\"hidden-xs-down\"><strong ng-class=\"student.Closeness >= 0 ? 'text-success' : 'text-danger'\">{{student.Closeness | number:2}}</strong></td><td class=\"hidden-xs-down\">{{student.AnnualGrowth | number:2}}</td><td><a ui-sref=\"editAssessment({student: student.id})\"><span ng-if=\"student['LastAssessment']\"><span class=\"hidden-xs-down\">Last:</span> {{student['LastAssessment'] | date:'M/d/yyyy'}}</span> <span ng-if=\"!student['LastAssessment']\">+ Create</span></a></td><td class=\"hidden-xs-down\">{{student['TextLevel']}}</td><td class=\"hidden-xs-down\">{{student['Genre']}}</td><td class=\"hidden-xs-down\">{{student['Mastery']}}</td><td class=\"hidden-xs-down\"><span ng-if=\"student.Accuracy\">{{student['Accuracy']}}%</span></td><td class=\"hidden-xs-down\">{{student['Comprehension']}}</td><td class=\"hidden-xs-down\">{{student['Fluency']}}</td><td class=\"hidden-xs-down\"><a href=\"#\" ng-if=\"student.Notes\" title=\"{{student.Notes}}\"><i class=\"fa fa-fw fa-align-left\"></i></a></td><td class=\"hidden-xs-down text-center\"><input type=\"checkbox\" ng-model=\"student.NeedToEnter\" ng-click=\"clickNeedToEnter(student)\"></td></tr></tbody></table>"
  );

}]);
