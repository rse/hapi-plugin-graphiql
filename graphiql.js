/*
**  Vote ~ Simple Voting App
**  Design and Development by msg Applied Technology Research
**  Copyright (c) 2016 msg systems ag (http://www.msg-systems.com/)
**
**  This Source Code Form is subject to the terms of the General Public License
**  (GPL), version 3.0. If a copy of the GPL was not distributed with this file,
**  You can obtain one at http://www.gnu.org/licenses/gpl.html.
*/

$(document).ready(function () {
    {{graphiqlGlobals}}

    /*  parse the search string to get url parameters  */
    var search = window.location.search
    var parameters = {}
    search.substr(1).split("&").forEach(function (entry) {
        var eq = entry.indexOf("=")
        if (eq >= 0)
            parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(entry.slice(eq + 1))
    })

    /*  if variables was provided, try to format it  */
    if (!parameters.query)
        parameters.query =
            "#   press Ctrl+SHIFT for auto-completing the input\n" +
            "#   press Cmd+ENTER  for executing the query\n" +
            "\n" +
            {{graphqlExample}}
    if (parameters.variables) {
        try {
            parameters.variables = JSON.stringify(JSON.parse(parameters.variables), null, 4)
        } catch (e) {
            /*  do nothing, as we want to display the invalid JSON
                as a string, rather than present an error  */
        }
    }
    else
        parameters.variables = "{}"

    /*  when the query and variables string is edited,
        update the URL bar so that it can be easily shared  */
    function updateURL () {
        var newSearch = "?" + Object.keys(parameters).filter(function (key) {
            return Boolean(parameters[key])
        }).map(function (key) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(parameters[key])
        }).join("&");
        history.replaceState(null, null, newSearch)
    }
    function onEditQuery (newQuery) {
        parameters.query = newQuery
        updateURL()
    }
    function onEditVariables (newVariables) {
        parameters.variables = newVariables
        updateURL()
    }
    function onEditOperationName (newOperationName) {
        parameters.operationName = newOperationName
        updateURL()
    }

    /*  support status line updating  */
    var statusLineTimer = null
    function statusLine (type, message) {
        if (type === "success")
            $("#status").removeClass("error").text(message)
        else
            $("#status").addClass("error").text(message)
        if (statusLineTimer !== null)
            clearTimeout(statusLineTimer)
        statusLineTimer = setTimeout(function () {
            $("#status").removeClass("error").html("&nbsp;")
            statusLineTimer = null
        }, 4 * 1000)
    }

    /*  connect to GraphQL backend using the Fetch API  */
    function graphQLFetcher (params) {
        return fetch(window.location.origin + "{{graphqlFetchURL}}", {{graphqlFetchOpts}})
        .then(function (response) {
            if (response.status >= 200 && response.status < 300)
                statusLine("success", "GraphQL request succeeded")
            else
                statusLine("error", "GraphQL request failed")
            return response.text()
        }).then(function (responseBody) {
            try {
                return JSON.parse(responseBody)
            } catch (error) {
                return responseBody
            }
        })
    }

    /*  authentication  */
    var username = ""
    var password = ""
    var login = function () {
        return fetch(window.location.origin + "{{loginFetchURL}}", {{loginFetchOpts}})
        .then(function (response) {
            if (response.status >= 200 && response.status < 300) {
                {{loginFetchSuccess}}
                statusLine("success", "Authentication succeeded")
            }
            else {
                {{loginFetchError}}
                statusLine("error", "Authentication failed")
            }
        })
    }

    /*  GraphiQL UI rendering  */
    var renderUI = function () {
        ReactDOM.render(React.createElement(GraphiQL, {
            fetcher:             graphQLFetcher,
            query:               parameters.query,
            variables:           parameters.variables,
            operationName:       parameters.operationName,
            onEditQuery:         onEditQuery,
            onEditVariables:     onEditVariables,
            onEditOperationName: onEditOperationName
        },
            React.createElement(GraphiQL.Toolbar, {},
                React.DOM.label({ id: "username-label", htmlFor: "username" }, "Username:"),
                React.DOM.input({
                    id: "username",
                    type: "text",
                    placeholder: "Username...",
                    onChange: function (arg) { username = arg.target.value }
                }),
                React.DOM.label({ id: "password-label", htmlFor: "password" }, "Password:"),
                React.DOM.input({
                    id: "password",
                    placeholder: "Password...",
                    type: "password",
                    onChange: function (arg) { password = arg.target.value }
                }),
                React.createElement(GraphiQL.ToolbarButton, {
                    label: "Authenticate",
                    title: "Authenticate at the service backend",
                    onClick: function () { login(); return true }
                })
            ),
            React.createElement(GraphiQL.Footer, {},
                React.DOM.div({ id: "status" }, "")
            )
        ), document.getElementById("graphiql"))
    }

    /*  login and then render UI  */
    renderUI()
    login()
})
