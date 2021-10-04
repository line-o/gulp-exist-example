xquery version "3.1";

declare namespace mylib = "http://mylib/";

declare variable $mylib:default := "value";

declare function mylib:callmemaybe ($nondefault as xs:string?) as xs:string {
    if ($nondefault) then $nondefault else $mylib:default
};
