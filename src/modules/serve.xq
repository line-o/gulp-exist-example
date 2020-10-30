xquery version "3.1";

declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "html5";
declare option output:media-type "text/html";

declare variable $local:file as xs:string := request:get-parameter("file", "not-found.html")

(: dump html :)
util:log("info", "serve " || $local:file),
doc("../pages/" || $local:file)