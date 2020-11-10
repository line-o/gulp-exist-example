xquery version "3.1";

declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "html5";
declare option output:media-type "text/html";

declare variable $local:template-collection := "../pages/";

declare function local:check-template ($file as xs:string) as xs:string? {
    if (doc-available($local:template-collection || $file))
    then ($file)
    else (error(xs:QName("template-not-found"), $file))
};

declare function local:serve ($file as xs:string) as node() {
    util:log("info", "serve the file " || $file),
    doc($local:template-collection || $file)
};

request:get-parameter("file", ())
    => local:check-template()
    => local:serve()
