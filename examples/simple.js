/* global d3:false */
/* jshint quotmark: true */
/* jshint latedef: nofunc */
(function (exports) {
  "use strict";

  var opts = {
    fill: d3.scale.category20(),
    dispSize: [1024, 768],
    font : "Serif",
    imgSize: [32, 16],
    bgText: {text: "2%", size: 300, rotate: 0},
    imgLimit: 1000,
    simInterval: 10,
    transDuration: 10
  };
  // TODO: use fontBaseline
  opts.bgText.y = opts.dispSize[1] / 2 + opts.bgText.size /2;

  var cloud = d3.layout.cloud().size(opts.dispSize)
              .spiral("rectangular")  // "rectangular, "archimedean""
              .startPos("point") // "point, area"
              .timeInterval(10)
              .words([opts.bgText]
                     // [
                     //  "Hello", "world", "normally", "you", "want", "more", "words",
                     //  "than", "this"
                     // ].map(function(d) {
                     // return {text: d, size: 300}; //  + Math.random() * 90};)
                    )
              .padding(0)
              // .rotate(function() { return ~~(Math.random() * 6) * 30; })
              .font(opts.font)
              .fontSize(function(d) { return d.size; })
              .on("placed", draw);

  var g = d3.select("body")
          .append("svg")
            .attr("width", opts.dispSize[0])
            .attr("height", opts.dispSize[1])
            .append("g")
              .attr("transform", "translate(" + opts.dispSize[0] / 2 + "," + opts.dispSize[1] / 2 + ")");

  function draw(tags, bounds, d) {
    g.selectAll("text")
    .data(tags.filter( function (d) { return !!d.text;}))
    .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", opts.font)
      .style("fill", function(d, i) { return opts.fill(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) { return d.text; });
    g.selectAll("image")
    .data(tags.filter( function (d) { return !!d.image;}))
    .enter().append("svg:image")
        .attr("xlink:href", function (d) { return d.href;})
        .attr("x", function (d) { return -d.imgWidth / 2;})
        .attr("y", function (d) { return -d.imgHeight / 2;})
        .attr("width", function (d) { return d.imgWidth;})
        .attr("height", function (d) { return d.imgHeight;})
        .attr("transform", "scale("+ opts.dispSize[0] / d.imgWidth +")")
      .transition().duration(opts.transDuration)
        // TODO: use translate d3.layout.cloud.js
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
    ;
  }

  var simulate = function (opts) {
    var timer;
    var imgCount = 0;
    var imgList = d3.range(10).map( function (d) {
      return (d + 1) + ".png";
    });
    return function () {
      timer = setInterval(function () {
        if (++imgCount >= opts.imgLimit) {
          clearInterval(timer);
        }
        cloud.addImg(imgList[Math.floor(Math.random() * 10)]);
      }, opts.simInterval);
    };
  };

  window.onload = function () {
    cloud.start();
    simulate(opts)();
  };

  exports.cloud = {
    cloud: cloud,
    opts: opts,
    simulate: simulate
  };
})(typeof exports === "undefined" ? window : exports);
