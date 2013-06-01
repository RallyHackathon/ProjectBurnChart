Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',
	layout: 'fit',

	launch: function() {
		this.setLoading(true);
		var projectRef = this.getContext().getProjectRef();
		var projectOid = this.getContext().getProject().ObjectID;
		this.loadIterations(projectRef, projectOid);
	},

	loadIterations: function(projectRef, projectOid){
		var app = this;

		var iterationStore = Ext.create('Rally.data.WsapiDataStore', {
			model: 'Iteration',
			context: {
				project: projectRef,
				projectScopeUp: false,
				projectScopeDown: false
			},
			filters: [
				{
					property: 'Project',
					value: projectRef
				}
			],
			sorters: [
			{
				property: 'EndDate',
				direction: 'ASC'
			}
	]
		});
		var iterationsPromise = iterationStore.load();
		iterationsPromise.then({
			success: function(records) {
				app.loadChart(records, projectOid);
				this.setLoading(false);
			},
			failure: function(error) {
				// Do something on failure.
				console.log("Failed to load iterations for project '"+ projectRef +"'");
				console.log(error);
			}
		});
	},

	loadChart: function(iterations, projectOid){
		var chart = {
			xtype: 'rallychart',

			storeType: 'Rally.data.lookback.SnapshotStore',
			storeConfig: {
				find: {
					'Project': projectOid,
					'_TypeHierarchy': 'HierarchicalRequirement',
					'Children': null
				},
				fetch: ['PlanEstimate', 'ObjectID', 'ScheduleState', '_ValidFrom', '_ValidTo', '_PreviousValues'],
				hydrate: ['ScheduleState'],
				sort: {'_ValidFrom': -1}
			},

			calculatorType: 'ActualCalculator',
			calculatorConfig: {
				iterations: iterations
			},

			chartConfig: {
				chart: {
					type: 'column'
				},
				title: {
					text: 'Project Iteration Burn Chart'
				},
				xAxis: {

				},
				yAxis: {
					min: 0,
					title: {
						text: 'Total story points'
					}
				},
				plotOptions: {
					column: {
						stacking: 'normal'
					}
				}
			}
		};

		this.add(chart);
	}
});
