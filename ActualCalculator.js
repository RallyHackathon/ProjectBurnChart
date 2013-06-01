Ext.define('ActualCalculator', {
	extend: 'Rally.data.lookback.calculator.BaseCalculator',

	runCalculation: function(snapshots) {
		var completedIterationTotals = {};
		var completedStoryIterations = {};

		var incompleteStoryIterations = {};
		var incompleteIterationTotals = {};
		var oldTotal, iteration, iterationName;
		for(var s=0, l=snapshots.length; s < l; s++){
			var snapshot = snapshots[s];
			var objectID = snapshot.ObjectID;
			iteration = this.getIteration(snapshot);
			if(!iteration){
				continue;
			}
			iterationName = iteration.get('Name');

			if(snapshot.ScheduleState === "Accepted"){
				if(snapshot._PreviousValues && (typeof snapshot._PreviousValues.ScheduleState) !== 'undefined' && !completedStoryIterations[objectID] ){
					completedStoryIterations[objectID] = iteration;
					oldTotal = completedIterationTotals[iterationName] || 0;
					completedIterationTotals[iterationName] = oldTotal + snapshot.PlanEstimate;
				}
			}
			else{
				incompleteStoryIterations[objectID] = iteration;
				oldTotal = incompleteIterationTotals[iterationName] || 0;
				incompleteIterationTotals[iterationName] = oldTotal + snapshot.PlanEstimate;
			}

		}

		var actualSeriesData = [];
		var backlogRemainingSeriesData = [];
		var categories = [];
		for(var i=0, il=this.iterations.length; i < il; i++){
			iteration = this.iterations[i];
			iterationName = iteration.get('Name');
			var completedIterationTotal = completedIterationTotals[iterationName] || 0;
			actualSeriesData.push(completedIterationTotal);

			var incompleteIterationTotal = incompleteIterationTotals[iterationName] || 0;
			backlogRemainingSeriesData.push(incompleteIterationTotal);

			var endLabel = Rally.util.DateTime.formatWithDefault( iteration.get('EndDate') );
			var iterationLabel = iteration.get('Name') +'<br/>'+ endLabel;
			categories.push(iterationLabel);
		}
		return {
			series: [
				{
					name: 'Actual (Accepted Points per iteration)',
					data: actualSeriesData
				},
				{
					name: 'Backlog Remaining (Points per iteration)',
					data: backlogRemainingSeriesData
				}
			],
			categories: categories
		};
	},

	getIteration: function(snapshot){
		for(var i=0, l=this.iterations.length; i < l; i++){
			var iteration = this.iterations[i];
			var iterationEnd = Rally.util.DateTime.toIsoString( iteration.get('EndDate'), true );
			if(snapshot._ValidFrom <= iterationEnd && snapshot._ValidTo > iterationEnd){
				return iteration;
			}
		}

		return null;
	}

});
