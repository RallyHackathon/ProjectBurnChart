Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',
	layout: 'fit',

	launch: function() {
		this.setLoading(true);
		var projectRef = this.getContext().getProjectRef();
		var projectOid = this.getContext().getProject().ObjectID;
		// var projectRef = '/project/11229304031';
		// var projectOid = 11229304031;
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
			success: function(iterations) {

				var iterationFilters = [];
				for(var i=0, l=iterations.length; i < l; i++){
					iterationFilters.push({
						property: 'Iteration',
						value: iterations[i].get('_ref')
					});
				}

				var capacityStore = Ext.create('Rally.data.WsapiDataStore', {
					model: 'useriterationcapacity',
					context: {
						project: projectRef,
						projectScopeUp: false,
						projectScopeDown: false
					},
					filters: Rally.data.QueryFilter.or(iterationFilters),
					fetch: ['Capacity', 'Iteration']
				});

				var capacityPromise = capacityStore.load();
				capacityPromise.then({
					success: function(capacities) {
						app.loadChart(iterations, capacities, projectOid);
						this.setLoading(false);
					},
					failure: function(error) {
						console.log("Failed to load iteration capacities");
						console.log(error);
					}
				});
			},
			failure: function(error) {
				console.log("Failed to load iterations for project '"+ projectRef +"'");
				console.log(error);
			}
		});
	},

	loadChart: function(iterations, capacities, projectOid){
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
				iterations: iterations,
				capacities: capacities
			},

			chartConfig: {
				chart: {
					type: 'column'
				},
				title: {
					text: 'Project Iteration Burn Chart'
				},
				xAxis: {
					// needed to keep it from blowing up
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
					},
					line: {
						connectNulls: true
					}
				}
			}
		};

		this.add(chart);
	}
});
