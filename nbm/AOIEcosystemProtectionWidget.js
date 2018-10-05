'use strict';

var AOIEcosystemProtectionWidget = function (bapConfig, bap) {
    let that = this;
    let chartData = {
        ecoregion_protection: {},
        ecosystem_coverage: [],
        ecological_systems: [],
        gap1_2: [],
        gap1_2_3: [],
    }

    const numberWithCommas = (x) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    this.getHtml = function () {
        return `<div id='${bap.id + 'Chart'}'></div>`
    };

    this.initializeWidget = function () {

        const poi = actionHandlerHelper.getSearhActionHandler().getPOI()

        if (poi && poi.selectedId) {
            const placeName = poi.selectedName
            this.getData(poi.selectedId, placeName)
                .then(function (flag) {
                    if (!flag) return;
                    that.bap.rawJson = chartData

                    let viewData = {
                        ecosystems: chartData.ecological_systems
                    };

                    let helpers = { format: formatStatusPercentage };
                    let html = getHtmlFromJsRenderTemplate('#ecosystemProtectionInfoTemplate', viewData, helpers);
                    $(`#${bap.id}Chart`).append(html)
                    $(`#${bap.id}Chart`).find('#regionProtectionSubtitle').html(`Protection Status of ${placeName} Compared to the Continental United States`)
                    $(`#${bap.id}Chart`).find('#ecoProtectionSubtitle').html(`Protection Status of ${placeName}`)

                    initializeEcoProtectionChart(chartData.ecoregion_protection);
                    initializeGapCharts(chartData.gap1_2, chartData.gap1_2_3);
                    initializeCoverageChart(chartData.ecosystem_coverage);
                    $("#resetEcosTable").on('click', function () {
                        resetEcosTable();
                    });
                })
        }
        else {
            $(`#${bap.id}BapCase`).hide()
        }
    };

    this.getPdfLayout = function () {
        var ecosRows = $('#ecosTable tbody').children();
        var ecosBody = this.getTableBody(ecosRows);

        return {
            content: [
                { text: $('#regionProtectionSubtitle').text(), style: ['bapContent', 'subtitle'], pageBreak: 'before' },
                { image: protectionChart.div.id, alignment: 'center', width: 300 },
                { text: $('#ecoProtectionSubtitle').text(), style: ['bapContent', 'subtitle'] },
                {
                    alignment: 'center',
                    columns: [
                        {
                            text: ''
                        },
                        {
                            width: 150,
                            image: gap12chart.div.id
                        },
                        {
                            text: ''
                        },
                        {
                            width: 150,
                            image: gap123chart.div.id
                        },
                        {
                            text: ''
                        }
                    ]
                },
                { text: $('#ecosystemTableTitle').text(), style: 'bapContent', margin: [0, 15, 0, 5], bold: true, alignment: 'center' },
                {
                    style: 'tableStyle',
                    table: {
                        headerRows: 1,
                        body: ecosBody
                    }
                },
                { text: $('#ecoCoverageSubtitle').text(), style: ['bapContent', 'subtitle'] },
                { image: ecoCoverageChart.div.id, alignment: 'center', width: 300 }
            ],
            charts: [protectionChart, gap12chart, gap123chart, ecoCoverageChart]
        };
    };

    this.getEcoregionCoverage = function (coverage) {

        let coverageData = []

        coverage.forEach(row => {
            
            let c = {
                color: that.getColorFromName(row.nvc_name),
                name: row.nvc_name,
                percent: row.percent_nvcs_cover
            }
            coverageData.push(c)
            
        })

        return coverageData.sort(function (a, b) {
            if (a.percent > b.percent) return -1;
            if (a.percent < b.percent) return 1;
            return 0;
        })
    }


    this.getEcologicalSystems = function (systems) {

        let systemsData = []
        let gap1_2 = [
            { color: '#660000', count: 0, name: '< 1%', },
            { color: '#FF0000', count: 0, name: '1 - 10%', },
            { color: '#EDCB62', count: 0, name: '10 - 17%', },
            { color: '#9CCB19', count: 0, name: '17 - 50%', },
            { color: '#228B22', count: 0, name: '> 50%', },
        ]
        let gap1_2_3 = [
            { color: '#660000', count: 0, name: '< 1%', },
            { color: '#FF0000', count: 0, name: '1 - 10%', },
            { color: '#EDCB62', count: 0, name: '10 - 17%', },
            { color: '#9CCB19', count: 0, name: '17 - 50%', },
            { color: '#228B22', count: 0, name: '> 50%', },
        ]

        systems.forEach(row => {

            if (!row.eco_code || !row.eco_code.includes('.')) {
                let c = {
                    acres: row.totalac,
                    name: row.nvc_name,
                    code: row.nvc_code,
                    status_1_2: row.gapstat12perc,
                    status_1_2_3: row.gapstat123perc,
                }
                systemsData.push(c)

                let total = systems.length

                if (row.gapstat12group == '<1') gap1_2[0].count += 1
                else if (row.gapstat12group == '1-10') gap1_2[1].count += 1
                else if (row.gapstat12group == '10-17') gap1_2[2].count += 1
                else if (row.gapstat12group == '17-50') gap1_2[3].count += 1
                else if (row.gapstat12group == '>50') gap1_2[4].count += 1

                if (row.gapstat123group == '<1') gap1_2_3[0].count += 1
                else if (row.gapstat123group == '1-10') gap1_2_3[1].count += 1
                else if (row.gapstat123group == '10-17') gap1_2_3[2].count += 1
                else if (row.gapstat123group == '17-50') gap1_2_3[3].count += 1
                else if (row.gapstat123group == '>50') gap1_2_3[4].count += 1

                gap1_2.forEach(x => {
                    x.percent = parseFloat(x.count / total) * 100
                })
                gap1_2_3.forEach(x => {
                    x.percent = parseFloat(x.count / total) * 100
                })
            }
        })

        systemsData = systemsData.sort(function (a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        })
        return {
            ecological_systems: systemsData,
            gap1_2: gap1_2,
            gap1_2_3: gap1_2_3
        }

    }

    this.getEcoregionProtection = function (protection, placeName) {

        let chunk = {
            CONUS_data: {
                name: "CONUS",
                chart_data: []
            },
            ecoregion_data: {
                name: placeName,
                chart_data: []
            }
        }

        if (protection.CONUS) {
            let total = parseFloat(protection.CONUS.gapstat1ac)
                + parseFloat(protection.CONUS.gapstat2ac)
                + parseFloat(protection.CONUS.gapstat3ac)
                + parseFloat(protection.CONUS.gapstat4ac);
            let temp = [
                {
                    id: "Status12",
                    value: numberWithCommas(parseInt(protection.CONUS.gapstat1ac + protection.CONUS.gapstat2ac)),
                    percent: ((protection.CONUS.gapstat1ac + protection.CONUS.gapstat2ac) / total) * 100
                },
                {
                    id: "Status3",
                    value: numberWithCommas(parseInt(protection.CONUS.gapstat3ac)),
                    percent: (protection.CONUS.gapstat3ac / total) * 100
                },
                {
                    id: "Status4",
                    value: numberWithCommas(parseInt(protection.CONUS.gapstat4ac)),
                    percent: (protection.CONUS.gapstat4ac / total) * 100
                }
            ]
            chunk.CONUS_data.chart_data = temp
        }
        if (protection[placeName]) {
            let total = parseFloat(protection[placeName].gapstat1ac)
                + parseFloat(protection[placeName].gapstat2ac)
                + parseFloat(protection[placeName].gapstat3ac)
                + parseFloat(protection[placeName].gapstat4ac);
            let temp = [
                {
                    id: "Status12",
                    value: numberWithCommas(parseInt(protection[placeName].gapstat1ac + protection[placeName].gapstat2ac)),
                    percent: ((protection[placeName].gapstat1ac + protection[placeName].gapstat2ac) / total) * 100
                },
                {
                    id: "Status3",
                    value: numberWithCommas(parseInt(protection[placeName].gapstat3ac)),
                    percent: (protection[placeName].gapstat3ac / total) * 100
                },
                {
                    id: "Status4",
                    value: numberWithCommas(parseInt(protection[placeName].gapstat4ac)),
                    percent: (protection[placeName].gapstat4ac / total) * 100
                }
            ]
            chunk.ecoregion_data.chart_data = temp
        }

        return chunk
    }

    this.getData = function (feature_id, placeName) {
        let url = this.bap.config.charts[0].apiEndpoint + feature_id
        return $.getJSON(url).then(function (data) {
            if (!data.success) {
                $(`#${bap.id}BapCase`).hide()
                return false;
            }
            else {
                chartData.ecoregion_protection = that.getEcoregionProtection(data.result.protection, placeName)
                chartData.ecosystem_coverage = that.getEcoregionCoverage(data.result.coverage)
                let ecologicalSystems = that.getEcologicalSystems(data.result.systems)
                chartData.ecological_systems = ecologicalSystems.ecological_systems
                chartData.gap1_2 = ecologicalSystems.gap1_2
                chartData.gap1_2_3 = ecologicalSystems.gap1_2_3
                return true
            }
        })

    }

    this.getColorFromName = function (name) {
        const colorMap = {

            'Forest & Woodland': '#267300',
            'Shrubland & Herb Vegetation': '#F6C467',
            'Shrub & Herb Vegetation': '#F6C467',
            'Desert and Semi-Desert': '#D2B48C',
            'Desert & Semi-Desert': '#D2B48C',
            'Polar & High Montane Scrub Grassland & Barrens': '#EDE0F2',
            'Polar & High Montane Scrub, Grassland & Barrens': '#EDE0F2',
            'Aquatic Vegetation': '#00C5FF',
            'Open Rock Vegetation': '#555857',
            'Agricultural And Developed Vegetation': '#FEFEC1',
            'Agricultural & Developed Vegetation': '#FEFEC1',
            'Developed & Other Human Use': '#C94D42',
            'Introduced & Semi Natural Vegetation': '#A1459C',
            'Recently Disturbed or Modified': '#872E26',
            'Open Water': '#002EC2',
            'Nonvascular & Sparse Vascular Rock Vegetation': '#8C8F91'
        }
        return colorMap[name] ? colorMap[name] : '#000000'
    }

    /**
     * Create the ecosystem protection chart.
     */
    var protectionChart;
    function initializeEcoProtectionChart(chartData) {
        var ecoregionData = chartData.ecoregion_data;
        var CONUSData = chartData.CONUS_data;
        var ecoregionChartData = AmChartsHelper.getChartDataFromJsonArray(ecoregionData.chart_data, 2);
        var CONUSChartData = AmChartsHelper.getChartDataFromJsonArray(CONUSData.chart_data, 2);

        var dataProviders = [
            getDataProvider(ecoregionData.name, ecoregionChartData),
            getDataProvider(CONUSData.name, CONUSChartData)
        ];

        var chartColor = AmChartsHelper.getChartColor();
        protectionChart = AmCharts.makeChart("protectionChart", {
            "type": "serial",
            "creditsPosition": "bottom-right",
            "color": chartColor,
            "marginTop": 0,
            "marginBottom": 0,
            "balloon": AmChartsHelper.getChartBalloonSettings({
                "fixedPosition": false
            }),
            "legend": {
                "color": chartColor,
                "horizontalGap": 2,
                "spacing": 2,
                "maxColumns": 1,
                "position": "bottom",
                "useGraphSettings": true,
                "markerSize": 15,
                "valueWidth": 15,
                "switchable": false
            },
            "dataProvider": dataProviders,
            "valueAxes": [{
                "stackType": "regular",
                "axisAlpha": 0.5,
                "gridAlpha": 0,
                "maximum": 100.0,
                "labelFrequency": 1,
                "gridCount": 10,
                "autoGridCount": false,
                "labelFunction": function (value) { if (value % 20 == 0) { return value + "%" } return " " }
            }],
            "graphs": [{
                "balloonText": "<b>[[Status12value]] acres</b><br><b>[[Status12percent]]%</b>",
                "fillAlphas": 1,
                "lineAlpha": 0.3,
                "lineColor": chartColor,
                "title": "GAP Status 1 & 2",
                "type": "column",
                "fillColors": "#5a8f29",
                "valueField": "Status12displayValue",
                "precision": 2
            }, {
                "balloonText": "<b>[[Status3value]] acres</b><br><b>[[Status3percent]]%</b>",
                "fillAlphas": 1,
                "lineAlpha": 0.3,
                "lineColor": chartColor,
                "title": "GAP Status 3",
                "type": "column",
                "fillColors": "#bbbbbb",
                "valueField": "Status3displayValue",
                "precision": 2
            }, {
                "balloonText": "<b>[[Status4value]] acres</b><br><b>[[Status4percent]]%</b>",
                "fillAlphas": 0,
                "lineAlpha": 0.3,
                "lineColor": chartColor,
                "title": "GAP Status 4",
                "type": "column",
                "fillColors": "#f1eee3",
                "valueField": "Status4displayValue",
                "precision": 2
            }],
            "rotate": true,
            "categoryField": "Name",
            "categoryAxis": {
                "gridPosition": "start",
                "axisAlpha": 0,
                "position": "left"
            },
            "export": {
                "enabled": true,
                "menu": []
            }
        });
    }

    /**
     * Returns a data provider for an AmCharts chart from the server data (chartData).
     * @param {string} name - name of the data provider
     * @param {*} chartData - data used to populate the data provider
     * @returns {*}
     */
    function getDataProvider(name, chartData) {
        var dataProvider = {
            "Name": name
        };
        chartData.forEach(function (data) {
            var percentProp = data.id + "percent";
            dataProvider[percentProp] = data.percent;
            var valProp = data.id + "value";
            dataProvider[valProp] = data.value;
            var displayValueProp = data.id + "displayValue";
            dataProvider[displayValueProp] = data.displayValue;
        });

        return dataProvider;
    }

    /**
     * Create the ecosystem GAP status charts.
     */
    var gap12chart, gap123chart;
    function initializeGapCharts(gap1_2, gap1_2_3) {
        var balloonText = "<span style='font-size:14px'><b>[[name]]<br>[[count]] ecosystems</b></span>";

        var gap12title = 'GAP Status 1 & 2';
        var gap12ChartData = AmChartsHelper.getChartDataFromJsonArray(gap1_2, 0, true);
        gap12chart = AmChartsHelper.getAmPieChart(gap12title, gap12ChartData, balloonText, AmChartsHelper.getAmLegend(), true);
        gap12chart.addListener('clickSlice', function (event) {
            gap12chart.validateData();
            updateEcosTable(gap12title, event.dataItem);
        });

        var gap123title = 'GAP Status 1, 2 & 3';
        var gap123ChartData = AmChartsHelper.getChartDataFromJsonArray(gap1_2_3, 0, true);
        gap123chart = AmChartsHelper.getAmPieChart(gap123title, gap123ChartData, balloonText, AmChartsHelper.getAmLegend(), true);
        gap123chart.addListener('clickSlice', function (event) {
            gap123chart.validateData();
            updateEcosTable(gap123title, event.dataItem);
        });

        // WRITE
        gap12chart.write("gap12chart");
        gap123chart.write("gap123chart");
    }

    /**
     * Update the ecosystem GAP status table.
     * @param {string} chartName - name of the chart calling this method
     * @param {*} dataItem - data used to filter and update the table
     */
    function updateEcosTable(chartName, dataItem) {
        let ecosystems = chartData.ecological_systems
        $("#ecosReset").show();

        var displayString = dataItem.dataContext.name;
        var bounds = getHigherAndLowerBounds(displayString);

        var myList = [];
        var gapStatusProperty = chartName == 'GAP Status 1 & 2' ? 'status_1_2' : 'status_1_2_3';

        for (var i = 0; i < ecosystems.length; i++) {
            var myEco = ecosystems[i];
            var value = myEco[gapStatusProperty];

            if (value >= bounds.lower && value < bounds.higher) {
                myList.push({ name: myEco['name'], acres: myEco['acres'], percent: value });
            }
        }

        var sorted = sortByPercent(myList);

        var viewData = {
            ecosystems: sorted
        };
        var helpers = { acresFormat: formatEcosAcresProtected, format: formatStatusPercentage };
        var html = getHtmlFromJsRenderTemplate('#updateEcosTableTemplate', viewData, helpers);
        $('#ecosTable').html(html);

        var plural = myList.length == 1 ? '' : 's';
        var title = myList.length + " Ecological System" + plural + " with " + displayString + " protection on " + chartName + " Lands";
        updateTableTitle('ecosystemTableTitle', title, dataItem.color, dataItem.index);
    }

    /**
     * Reset the ecosystem GAP status to it's original state.
     */
    function resetEcosTable() {
        let ecosystems = chartData.ecological_systems
        $("#ecosReset").hide();

        var viewData = {
            ecosystems: ecosystems
        };
        var helpers = { format: formatStatusPercentage };
        var html = getHtmlFromJsRenderTemplate('#ecosTableContainerTemplate', viewData, helpers);

        $("#ecosTableContainer").html(html);
    }

    /**
     * Returns a formatted string of the number of acres protected.
     * @param {number} totalAcres
     * @param {number} percent - percent of totalAcres protected
     * @returns {string}
     */
    function formatEcosAcresProtected(totalAcres, percent) {
        var protectedAcres = totalAcres / 100.0 * percent;
        return protectedAcres < 1 && protectedAcres > 0 ? '< 1' : formatAcres(protectedAcres);
    }

    /**
     * Create the coverage chart.
     */
    var ecoCoverageChart;
    function initializeCoverageChart(ecosystem_coverage) {
        var balloonText = "[[name]]<br><span style='font-size:14px'><b>[[percent]]%</b></span>";
        var pieChartData = AmChartsHelper.getChartDataFromJsonArray(ecosystem_coverage, 2);
        ecoCoverageChart = AmChartsHelper.getAmPieChart('', pieChartData, balloonText);
        ecoCoverageChart.marginTop = -40;
        ecoCoverageChart.numberFormatter = { precision: 0, decimalSeparator: '.', thousandsSeparator: ',' };
        ecoCoverageChart.marginBottom = -40;

        var legend = AmChartsHelper.getAmLegend();
        ecoCoverageChart.addLegend(legend, "ecoCoverageLegend");

        // WRITE
        ecoCoverageChart.write("ecoCoverageChart");
    }

};
inherit(Widget, AOIEcosystemProtectionWidget);