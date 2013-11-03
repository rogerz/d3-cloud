/* global d3:false */
/* jshint quotmark: true */
/* jshint latedef: nofunc */
(function (exports) {
  "use strict";

  var imgList = d3.range(10).map( function (d) {
    return (d + 1) + ".png";
  });

  var opts = {
    fill: function () { return "black"; }, //d3.scale.category20(),
    dispSize: [1080, 640],
    font : "Serif",
    imgSize: [64, 32],
    bgImg: {image: imgList[Math.floor(Math.random() * 10)], rotate: 0, visibility: "hidden", size: "auto"},
    imgLimit: 1000,
    simInterval: 2000,
    transDuration: 2000
  };

  var cloud = d3.layout.cloud().size(opts.dispSize)
              .spiral("rectangular")  // "rectangular, "archimedean""
              .startPos("point") // "point, area"
              .timeInterval(10)
              .on("placed", draw);
/*
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
*/
  var scale = 1;
  var offset = [opts.dispSize[0] / 2, opts.dispSize[1] / 2];
  var g = d3.select("body")
          .append("svg")
            .attr("width", opts.dispSize[0])
            .attr("height", opts.dispSize[1])
          .append("g")
            .attr("transform", "translate(" + offset + ")");
  function draw(tags, bounds, d) {
    if (d && d.visibility === "hidden") {
      return;
    }
    // update bound
    d3.selectAll("g")
    .data([bounds])
    .transition().duration(opts.transDuration)
    .attr("transform", function (b) {
      var scaleStr;
      if (b) {
        // half size
        var hw = opts.dispSize[0] / 2, hh = opts.dispSize[1] / 2;
        var scaleH = 1 / (Math.max((hw - b[0].x) / hw, (b[1].x - hw) / hw));
        var scaleW = 1 / (Math.max((hh - b[0].y) / hh, (b[1].y - hh) / hh));
        scale = Math.min(Math.min(scaleH, scaleW));
        scaleStr = "scale(" + scale + ")";
      } else {
        scaleStr = "";
      }
      var translate = "translate(" + offset + ")";
      return translate + scaleStr;
    });

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
        .style("visibility", function (d) { return d.visibility;})
        .attr("xlink:href", function (d) { return d.href;})
        .attr("x", function (d) { return -d.imgWidth / 2;})
        .attr("y", function (d) { return -d.imgHeight / 2;})
        .attr("width", function (d) { return d.imgWidth;})
        .attr("height", function (d) { return d.imgHeight;})
        .attr("transform", "scale("+ opts.dispSize[0] / d.imgWidth / scale + ")")
      .transition().duration(opts.transDuration)
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
    ;
  }

  var simulate = function (opts) {
    var timer;
    var imgCount = 0;
    return function () {
      cloud.addImg(opts.bgImg);
      function step() {
        if (++imgCount >= opts.imgLimit) {
          clearTimeout(timer);
        }
        cloud.addImg({
          image: imgList[Math.floor(Math.random() * 10)],
          imgWidth: opts.imgSize[0],
          imgHeight: opts.imgSize[1]
        });
        timer = setTimeout(step, opts.simInterval);
      }
      timer = setTimeout(step, opts.simInterval);
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
