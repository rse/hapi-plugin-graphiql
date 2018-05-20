
Downstream/Local GraphiQL Version
=================================

This is a snapshot of the pre-built upstream [GraphiQL](https://github.com/graphql/graphiql) code as of 2018-05-20.
It was [patched](graphiql.diff) to provide the following distinct changes against the upstream version (in order
of importance for me):

- In the "Docs" (DocExplorer) view, a reference like `[Type]()` is
  rendered as a hyperlinked type reference in case `Type` is a defined
  GraphQL standard or custom type.
  Rationale: I want to hyperlink types in type descriptions.

- In the "Docs" (DocExplorer) view, add the kind of content (type or field).
  Rationale: it should be more clear what the users sees.

- On pressing the button "Prettify", in addition to pretty-printed the Query source,
  also the Variables source is pretty-printed.
  Rationale: The variables should be also pretty-printed, of course.

- On pressing the button "Prettify", the Query source is pretty-printed,
  but instead of an indentation of 2 spaces it uses an indentation of 4 spaces.
  Rationale: I just prefer 4 spaces in all source codes.

- All built-in foreign module dependencies were upgraded to their latest versions.
  Rationale: I want to have the latest and greatest bugfixed versions, of course.

