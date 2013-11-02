/* global d3:false */
/* jshint quotmark: true */
/* jshint latedef: nofunc */

"use strict";
var fill = d3.scale.category20();
var size = [1024, 768];
var fontFamily = "Serif";
var cloud = d3.layout.cloud().size(size)
.initPos("point")
.spiral("rectangular")
.timeInterval(10)
.words([
  "2%"
//  "Hello", "world", "normally", "you", "want", "more", "words",
//  "than", "this"
].map(function(d) {
  return {text: d, size: 400}; //  + Math.random() * 90};
}))
.padding(0)
.rotate(function() { return ~~(Math.random() * 6) * 30; })
.font(fontFamily)
.fontSize(function(d) { return d.size; })
window.onload = function () {
  cloud.start()
  .images(d3.range(1000).map(function() {
    // image: id for generating href
    return {image: 1, img: document.getElementById("sample"), imgWidth: 32, imgHeight: 16};
  }))
  .imageHref(function (d) { return "images/" + d.image + ".png"; })
//  .imageWidth(function (d) { return d.width; })
//  .imageHeight(function (d) { return d.height; })
  .on("end", draw)
  .start();
};

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
  .style("font-family", fontFamily)
  .style("fill", function(d, i) { return fill(i); })
  .attr("text-anchor", "middle")
  .attr("transform", function(d) {
    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
  })
  .text(function(d) { return d.text; });
  g.selectAll("image")
  .data(tags.filter( function (d) { return !!d.image;}))
  .enter().append("svg:image")
  .attr("x", function (d) { return -d.imgWidth / 2;})
  .attr("y", function (d) { return -d.imgHeight / 2;})
  .attr("transform", function(d) {
    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
  })
  .attr("width", function (d) { return d.imgWidth;})
  .attr("height", function (d) { return d.imgHeight;})
  .attr("xlink:href", function (d) { return d.href;});
}
