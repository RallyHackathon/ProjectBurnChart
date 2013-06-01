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

		var backlogBurnProjectionSeriesData = this.calculateBacklogBurnProjection(backlogRemainingSeriesData, actualSeriesData, categories);

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
					name: 'Backlog burn projection',
					type: 'line',
					data: backlogBurnProjectionSeriesData
				}
			],
			categories: categories
		};
	},

	// old way, instead of backlog burn projection
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

	calculateBacklogBurnProjection: function(backlogRemainingSeriesData, actualSeriesData, categories){
		var twoWeeksInMillis = 2 * 7 * 24 * 60 * 60 * 1000;
		var backlogRemaining = backlogRemainingSeriesData[0];
		var data = [backlogRemaining];
		var last3AverageActuals;
		var lastIterationModel = this.iterations[this.iterations.length -1];
		var lastIteration = {
			endDate: lastIterationModel.get('EndDate')
		};

		// debugger;
		var notStarted = true;
		for(var i=1, l=this.iterations.length; (notStarted && i < l) || backlogRemaining > 0; i++){
			if(i >= l){
				lastIteration = {
					endDate: new Date( lastIteration.endDate.getTime() + twoWeeksInMillis )
				};
				var iterationLabel =  Rally.util.DateTime.formatWithDefault(lastIteration.endDate);
				categories.push(iterationLabel);
			}
			else{
				backlogRemaining = backlogRemainingSeriesData[i];
			}

			if( notStarted && backlogRemaining === 0 ){
				continue;
			}
			notStarted = false;

			last3AverageActuals = 0;
			var actualCount = 0;
			for(var j=i-2; j <= i; j++){
				if(j < 0){
					continue;
				}
				last3AverageActuals += actualSeriesData[j];
				actualCount++;
			}
			last3AverageActuals /= actualCount;

			backlogRemaining -= last3AverageActuals;
			data.push(backlogRemaining);
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
