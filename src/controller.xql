xquery version "3.1";

declare variable $exist:controller external;
declare variable $exist:resource external;
declare variable $exist:path external;

util:log('info', (
    'c', $exist:controller, 'p', $exist:path, 'r', $exist:resource)),
if ($exist:path eq "")
then (
    (: forward to / :)
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <redirect url="{request:get-uri()}/"/>
    </dispatch>
)
else if ($exist:path eq "/")
then (
    (: forward to /modules/serve.xq :)
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <forward url="{$exist:controller}/modules/serve.xq" method="get">
            <add-parameter name="file" value="index.html"/>        
        </forward>
    </dispatch>
)
else if (matches($exist:path, "/static/.+"))
then (
    (: forward to /static/(.+) if available and cache :)
    let $real-url := $exist:controller || replace($exist:path, '/static', '' )
    return (
        util:log("info", "static web resource:" || $exist:path || " redirect to " || $real-url),
        <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
            <set-header name="Cache-Control" value="max-age=2419200, must-revalidate, stale-while-revalidate=86400"/>
            <cache-control cache="yes"/>
            <forward url="{$real-url}" />
        </dispatch>
    )
)
else (
    (:
     : everything else is a 404,
     : log warning to exist.log for inspection
     :)
    let $status-code := response:set-status-code(404)

    return
        util:log('warn', ('Unknown path: ', $exist:path)),
        <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
            <forward url="{$exist:controller}/modules/serve.xq" method="get">
                <add-parameter name="file" value="not-found.html"/>        
            </forward>
        </dispatch>
)