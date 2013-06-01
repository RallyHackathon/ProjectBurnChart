Ext.define('ActualCalculator', {
	extend: 'Rally.data.lookback.calculator.BaseCalculator',

	runCalculation: function(snapshots) {
		var completedIterationTotals = {};
		var completedStoryIterations = {};

		var incompleteIterationTotals = {};
		var oldTotal, iteration, iterationName;
		for(var s=0, l=snapshots.length; s < l; s++){
			var snapshot = snapshots[s];
			var objectID = snapshot.ObjectID;
			var iterations = this.getMatchingIterations(snapshot);
			if(iterations.length === 0){
				continue;
			}

			if(snapshot.ScheduleState === "Accepted"){
				iteration = iterations[0];
				iterationName = iteration.get('Name');
				if(snapshot._PreviousValues && (typeof snapshot._PreviousValues.ScheduleState) !== 'undefined' && !completedStoryIterations[objectID] ){
					completedStoryIterations[objectID] = iteration;
					oldTotal = completedIterationTotals[iterationName] || 0;
					completedIterationTotals[iterationName] = oldTotal + snapshot.PlanEstimate;
				}
			}
			else{
				for(var iter=0, iterL = iterations.length; iter < iterL; iter++){
					iteration = iterations[iter];
					iterationName = iteration.get('Name');
					oldTotal = incompleteIterationTotals[iterationName] || 0;
					incompleteIterationTotals[iterationName] = oldTotal + snapshot.PlanEstimate;
				}
			}

		}

		var actualSeriesData = [];
		var backlogRemainingSeriesData = [];
		var devIncreaseSeriesData = [];
		var devIncrease;
		var previousBacklogRemaining = null;
		var categories = [];
		for(var i=0, il=this.iterations.length; i < il; i++){
			iteration = this.iterations[i];
			iterationName = iteration.get('Name');
			var completedIterationTotal = completedIterationTotals[iterationName] || 0;
			actualSeriesData.push(completedIterationTotal);

			var backlogRemaining = incompleteIterationTotals[iterationName] || 0;
			backlogRemainingSeriesData.push(backlogRemaining);

			if(i === 0){
				devIncreaseSeriesData.push(0);
			}
			else{
				devIncrease = Math.max(backlogRemaining - previousBacklogRemaining + completedIterationTotal, 0);
				devIncreaseSeriesData.push(devIncrease);
			}
			previousBacklogRemaining = backlogRemaining;

			var endLabel = Rally.util.DateTime.formatWithDefault( iteration.get('EndDate') );
			var iterationLabel = iteration.get('Name') +'<br/>'+ endLabel;
			categories.push(iterationLabel);
		}

		var capacityBurnSeriesData = this.calculateCapacityBurn();

		return {
			series: [
				{
					name: 'Dev Increase (Points per iteration)',
					data: devIncreaseSeriesData
				},
				{
					name: 'Actual (Accepted Points per iteration)',
					data: actualSeriesData
				},
				{
					name: 'Backlog Remaining (Points per iteration)',
					data: backlogRemainingSeriesData
				},
				{
					name: 'Capacity burn',
					type: 'line',
					data: capacityBurnSeriesData
				}
			],
			categories: categories
		};
	},

	calculateCapacityBurn: function(){
		var iterationRef;
		var iterationCapacities = {};
		for(var c=0, l=this.capacities.length; c < l; c++){
			var capacity = this.capacities[c];
			iterationRef = capacity.get('Iteration')._ref;
			var oldTotal = iterationCapacities[iterationRef] || 0;
			iterationCapacities[iterationRef] = oldTotal + capacity.get('Capacity');
		}

		var data = [0];
		var remainingCapacity = 0;

		for(var i=this.iterations.length-1; i > 0; i--){
			var iteration = this.iterations[i];
			iterationRef = iteration.get('_ref');
			var iterationCapacity = iterationCapacities[iterationRef] || 0;
			remainingCapacity += iterationCapacity;
			data.unshift(remainingCapacity);
		}

		return data;
	},

	getMatchingIterations: function(snapshot){
		var matches = [];
		for(var i=0, l=this.iterations.length; i < l; i++){
			var iteration = this.iterations[i];
			var iterationEnd = Rally.util.DateTime.toIsoString( iteration.get('EndDate'), true );
			if(snapshot._ValidFrom <= iterationEnd && snapshot._ValidTo > iterationEnd){
				matches.push(iteration);
			}
		}

		return matches;
	}

});
