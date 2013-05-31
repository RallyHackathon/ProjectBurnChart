Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',

	items: [
		{
			xtype: 'rallychart',
			chartData: {
				series: [{
					name: 'John',
					data: [5, 3, 4, 7, 2]
				}, {
					name: 'Jane',
					data: [2, 2, 3, 2, 1]
				}, {
					name: 'Joe',
					data: [3, 4, 4, 2, 5]
				}]
			},
			chartConfig: {
				chart: {
					type: 'column'
				},
				title: {
					text: 'Stacked column chart'
				},
				xAxis: {
					categories: ['Apples', 'Oranges', 'Pears', 'Grapes', 'Bananas']
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Total fruit consumption'
					}
				},
				legend: {
					align: 'right',
					x: -100,
					verticalAlign: 'top',
					y: 20,
					floating: true,
					borderColor: '#CCC',
					borderWidth: 1,
					shadow: false
				},
				tooltip: {
					formatter: function() {
						return '<b>'+ this.x +'</b><br/>'+
						this.series.name +': '+ this.y +'<br/>'+
						'Total: '+ this.point.stackTotal;
					}
				},
				plotOptions: {
					column: {
						stacking: 'normal'
					}
				}
			}
		}
	],

	launch: function() {
        //Write app code here
    }
});
