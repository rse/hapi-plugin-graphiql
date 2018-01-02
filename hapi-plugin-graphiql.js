/*
**  hapi-plugin-graphiql -- HAPI plugin for GraphiQL integration
**  Copyright (c) 2016-2017 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  built-in dependencies  */
var path     = require("path")

/*  external dependencies  */
var Promise  = require("bluebird")
var fs       = require("mz/fs")
var Boom     = require("boom")
var co       = require("co")
var nunjucks = require("nunjucks")

/*  internal dependencies  */
var Package  = require("./package.json")

/*  the HAPI plugin register function  */
var register = function (server, options) {
    /*  determine options  */
    options = Object.assign({}, {
        graphiqlSource: "downstream",
        graphiqlGlobals: "",
        graphiqlURL: "/graphiql",
        graphqlFetchURL: "/graphql",
        graphqlFetchOpts:
            "{\n" +
            "    method: \"POST\",\n" +
            "    headers: {\n" +
            "        \"Content-Type\": \"application/json\",\n" +
            "        \"Accept\":       \"application/json\"\n" +
            "    },\n" +
            "    body: JSON.stringify(params),\n" +
            "    credentials: \"same-origin\"\n" +
            "}\n",
        loginFetchURL: "/login",
        loginFetchOpts:
            "{\n" +
            "    method: \"POST\",\n" +
            "    headers: {\n" +
            "        \"Content-Type\": \"application/json\"\n" +
            "    },\n" +
            "    body: JSON.stringify({\n" +
            "        username: username,\n" +
            "        password: password\n" +
            "    }),\n" +
            "    credentials: \"same-origin\"\n" +
            "}\n",
        loginFetchSuccess: "",
        loginFetchError: "",
        graphqlExample:
            "query Example {\n" +
            "    Session {\n" +
            "        __typename # schema introspection\n" +
            "    }\n" +
            "}\n",
        documentationURL:  "",
        documentationFile: ""
    }, options)

    /*  convenience redirect  */
    server.route({
        method: "GET",
        path: options.graphiqlURL,
        handler: function (request, h) {
            return h.redirect(options.graphiqlURL + "/")
        }
    })

    /*  static delivery of GraphiQL tool  */
    server.route({
        method: "GET",
        path: options.graphiqlURL + "/{name*}",
        handler: co.wrap(function * (request, h) {
            var name = request.params.name
            var files, content
            var loadFiles = co.wrap(function * (files) {
                return (yield (Promise.map(files, co.wrap(function * (file) {
                    var m
                    var isTemplate = false
                    if ((m = file.match(/^%(.+)$/)) !== null) {
                        isTemplate = true
                        file = m[1]
                    }
                    if ((m = file.match(/^@([^\/]+)\/(.+)$/)) !== null) {
                        file = require.resolve(path.join(m[1], "package.json"))
                        file = path.resolve(file.replace(/package\.json$/, ""), m[2])
                    }
                    else
                        file = path.join(__dirname, file)
                    var data = yield (fs.readFile(file, "utf8"))
                    if (isTemplate) {
                        var env = nunjucks.configure({ autoescape: false })
                        data = (new nunjucks.Template(data, env)).render({
                            graphiqlGlobals:   options.graphiqlGlobals,
                            graphqlFetchURL:   options.graphqlFetchURL,
                            graphqlFetchOpts:  options.graphqlFetchOpts,
                            loginFetchURL:     options.loginFetchURL,
                            loginFetchOpts:    options.loginFetchOpts,
                            loginFetchSuccess: options.loginFetchSuccess,
                            loginFetchError:   options.loginFetchError,
                            graphqlExample:    JSON.stringify(options.graphqlExample)
                        })
                    }
                    return data
                })))).join("")
            })
            if (name === undefined || name === "" || name === "graphiql.html") {
                /*  deliver HTML  */
                files = [
                    "graphiql.html"
                ]
                content = yield (loadFiles(files))
                var response = h.response(content)
                response.type("text/html")
                return response
            }
            else if (name === "graphiql.js") {
                /*  deliver JS  */
                files = [
                    "@jquery/dist/jquery.min.js",
                    "@whatwg-fetch/fetch.js",
                    "@react/umd/react.production.min.js",
                    "@react-dom/umd/react-dom.production.min.js",
                    "@react-dom-factories/index.js",
                    (options.graphiqlSource === "downstream" ? "./local/graphiql.min.js": "@graphiql/graphiql.min.js"),
                    "%graphiql.js"
                ]
                content = yield (loadFiles(files))
                var response = h.response(content)
                response.type("text/javascript")
                return response
            }
            else if (name === "graphiql.css") {
                /*  deliver CSS  */
                files = [
                    (options.graphiqlSource === "downstream" ? "./local/graphiql.css": "@graphiql/graphiql.css"),
                    "graphiql.css"
                ]
                content = yield (loadFiles(files))
                var response = h.response(content)
                response.type("text/css")
                return response
            }
            else
                return Boom.badRequest("invalid path")
        })
    })

    /*  optional static delivery of documentation  */
    if (options.documentationURL !== "" && options.documentationFile !== "") {
        server.route({
            method: "GET",
            path: options.documentationURL,
            handler: co.wrap(function * (request, h) {
                return h.file(options.documentationFile, { confine: false })
            })
        })
    }
}

/*  export register function, wrapped in a plugin object  */

exports.plugin = {
  pkg: Package,
  register,
};