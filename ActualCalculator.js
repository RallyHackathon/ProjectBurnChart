Ext.define('ActualCalculator', {
	extend: 'Rally.data.lookback.calculator.BaseCalculator',

	runCalculation: function(snapshots) {
		var iterationTotals = {};
		var storyIterations = {};
		for(var s=0, l=snapshots.length; s < l; s++){
			var snapshot = snapshots[s];
			var objectID = snapshot.ObjectID;
			if( storyIterations[objectID] ){
				continue;
			}

			var iteration = this.getIteration(snapshot);
			if(!iteration){
				continue;
			}

			storyIterations[objectID] = iteration;
			var iterationName = iteration.get('Name');
			var oldTotal = iterationTotals[iterationName] || 0;
			iterationTotals[iterationName] = oldTotal + snapshot.PlanEstimate;
		}

		var seriesData = [];
		var categories = [];
		for(var i=0, il=this.iterations.length; i < il; i++){
			var iteration = this.iterations[i];
			var iterationTotal = iterationTotals[iteration.get('Name')] || 0;
			seriesData.push(iterationTotal);
			var iterationLabel = iteration.get('Name') +'<br/>'+ iteration.get('EndDate');
			categories.push(iterationLabel);
		}
		return {
			series: [
				{
					name: 'Actual (Accepted Stories per iteration)',
					data: seriesData
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
