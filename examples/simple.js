/* global d3:false */
/* jshint quotmark: true */
/* jshint latedef: nofunc */

"use strict";
var fill = d3.scale.category20();
var size = [800, 400];
d3.layout.cloud().size(size)
.initPos("point")
.words(["2%"
        /*        "Hello", "world", "normally", "you", "want", "more", "words",
                  "than", "this" */].map(function(d) {
                    return {text: d, size: 200}; //  + Math.random() * 90};
                  }))
.padding(5)
.rotate(0 /*function() { return ~~(Math.random() * 2) * 90; }*/)
.font("Impact")
.fontSize(function(d) { return d.size; })
.images(d3.range(10).map(function(d) {
  // image: id for generating href
  return {image: d + 1, width: 30, height: 20};
}))
.imageHref(function (d) { return "images/" + d.image + ".png"; })
.imageWidth(function (d) { return d.width; })
.imageHeight(function (d) { return d.height; })
.on("end", draw)
.start();

function draw(tags) {
  var g = d3.select("body").append("svg")
          .attr("width", size[0])
          .attr("height", size[1])
          .append("g")
          .attr("transform", "translate(" + size[0] / 2 + "," + size[1] / 2 + ")");
  g.selectAll("text")
  .data(tags.filter( function (d) { return !!d.text;}))
  .enter().append("text")
  .style("font-size", function(d) { return d.size + "px"; })
  .style("font-family", "Impact")
  .style("fill", function(d, i) { return fill(i); })
  .attr("text-anchor", "middle")
  .attr("transform", function(d) {
    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
  })
  .text(function(d) { return d.text; });
  g.selectAll("image")
  .data(tags.filter( function (d) { return !!d.image;}))
  .enter().append("svg:image")
  .attr("x", function (d) { return d.x;})
  .attr("y", function (d) { return d.y;})
  .attr("transform", function(d) {
    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
  })
  .attr("width", function (d) { return d.width;})
  .attr("height", function (d) { return d.height;})
  .attr("xlink:href", function (d) { return d.href;});
}
