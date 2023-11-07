import "./style.scss";
import * as d3 from "/node_modules/d3";

const drawMap = function (d) {
  const margin = { top: 25, left: 100, bottom: 100, right: 100 };
  const width = 1500;
  const height = 700;

  const COLORS = [
    "#67001f",
    "#b2182b",
    "#d6604d",
    "#f4a582",
    "#fddbc7",
    "#f7f7f7",
    "#d1e5f0",
    "#92c5de",
    "#4393c3",
    "#2166ac",
    "#053061",
  ];

  const legendWidth = 400;
  const legendHeight = 300 / COLORS.length;
  const variance = d.monthlyVariance.map(function (d) {
    return d.variance;
  });
  const minTemp = d.baseTemperature + Math.min.apply(null, variance);
  const maxTemp = d.baseTemperature + Math.max.apply(null, variance);

  const baseTemperature = d.baseTemperature;

  const timeFormat = d3.timeFormat("%B");

  console.log(
    d.monthlyVariance.map(function (val) {
      return val.year;
    })
  );

  const xScale = d3
    .scaleBand()
    .domain(
      d.monthlyVariance.map(function (d) {
        return d.year;
      })
    )
    .range([0, width - margin.left - margin.right])
    .padding(0);

  const yScale = d3
    .scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .range([0, height - margin.bottom - margin.top]);

  const colorScale = d3
    .scaleThreshold()
    .domain(
      (function (min, max, count) {
        var array = [];
        var step = (max - min) / count;
        var base = min;
        for (var i = 1; i < count; i++) {
          array.push(base + i * step);
        }
        console.log(array);
        return array;
      })(minTemp, maxTemp, COLORS.length)
    )
    .range(COLORS.reverse());

  const tooltip = d3
    .select(".graph")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", "0");

  const svg = d3
    .select(".graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("g")
    .attr("id", "x-axis")
    .attr(
      "transform",
      "translate(0," + (height - margin.bottom - margin.top) + ")"
    )
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(
          xScale.domain().filter(function (year) {
            // set ticks to years divisible by 10
            return year % 10 === 0;
          })
        )
        .tickFormat(function (year) {
          var date = new Date(0);
          date.setUTCFullYear(year);
          var format = d3.utcFormat("%Y");
          return format(date);
        })
        .tickSize(10, 1)
    )
    .append("text")
    .attr("class", "label")
    .attr("x", (width - margin.left - margin.right) / 2)
    .attr("y", 50)
    .text("Year");

  svg
    .append("g")
    .attr("id", "y-axis")
    .call(
      d3.axisLeft(yScale).tickFormat(function (d) {
        const date = new Date(0, d);
        var format = d3.utcFormat("%B");
        return format(date);
      })
    )
    .append("text")
    .attr("class", "label")
    .attr("x", -(height - margin.top - margin.bottom) / 2)
    .attr("y", -65)
    .attr("transform", "rotate(-90)")
    .text("Month");

  svg
    .append("g")
    .selectAll("rect")
    .data(d.monthlyVariance)
    .join("rect")
    .classed("cell", true)
    .attr("data-month", (d) => d.month)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => baseTemperature + d.variance)
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", function (d) {
      return colorScale(baseTemperature + d.variance);
    })
    .on("mouseover", function (event, d) {
      tooltip.attr("data-year", d.year);
      var date = d.date;
      var str =
        "<span class='date'>" +
        d3.utcFormat("%Y - %B")(date) +
        "</span>" +
        "<br />" +
        "<span class='temperature'>" +
        d3.format(".1f")(baseTemperature + d.variance) +
        "&#8451;" +
        "</span>" +
        "<br />" +
        "<span class='variance'>" +
        d3.format("+.1f")(d.variance) +
        "&#8451;" +
        "</span>";
      tooltip.style("opacity", ".9");
      tooltip
        .html(str)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY -50 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  const legendX = d3
    .scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, legendWidth]);

  const legend = svg
    .append("g")
    .classed("legend", true)
    .attr("id", "legend")
    .attr(
      "transform",
      "translate(" +
        margin.left +
        "," +
        (height - margin.bottom - margin.top + 50) +
        ")"
    );

  legend
    .append("g")
    .selectAll("rect")
    .data(
      colorScale.range().map(function (color) {
        var d = colorScale.invertExtent(color);
        if (d[0] == null) {
          d[0] = legendX.domain()[0];
        }
        if (d[1] == null) {
          d[1] = legendX.domain()[1];
        }

        return d;
      })
    )
    .join("rect")
    .style("fill", function (d) {
      return colorScale(d[0]);
    })
    .attr("x", (d) => legendX(d[0]))
    .attr("y", 0)
    .attr("width", (d) =>
      d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null)
    )
    .attr("height", legendHeight);

  legend
    .append("g")
    .attr("transform", "translate(" + 0 + "," + legendHeight + ")")
    .call(
      d3
        .axisBottom(legendX)
        .tickSize(10, 0)
        .tickValues(colorScale.domain())
        .tickFormat(d3.format(".1f"))
    );
};

d3.json(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
).then(function (d) {
  d.monthlyVariance.forEach(function (d) {
    d.month -= 1;
    d.date = new Date(d.year, d.month);
  });

  console.log(d);
  drawMap(d);
});
