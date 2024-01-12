Further thoughts:
Create, update, delete methods implies to all pages have to be recompiled and reexported. Because loadable-components puts link="reload" for all pages inside all pages + script async. As result first way is to reexport all pages, and move only changed bundles from temporary to persistent folder, but in this case all exported pages have to be copied also. Avarage size of exported page is 1-3Mb, and copying 1000 pages can be really expensive.

Possible solutions:

1.  we can reexport only created, updated, deleted page and update all required
    recompiled bundles only for this page. In this case all old pages can use
    previous compiled bundles, but of course size of persistent folder will grow
    really fast because folder will contain all versions of all recompiled files
    after every create, update, delete invocation

2.  extended previous solution, we can keep actual hash of compilation somewhere.
    Just create a files hashes, where every page bundle has version of compilation hash
    where the files where compiled. If some bundles where recompiled we keep new version
    of compilation hash and make actual this compilation hash. Also, we need to implement job
    which we check all not actual pages and run reexport for them and update version of that pages.

3.  also extended previous solution, we will reexport all pages and write all changed bundles
    from temporary to persistent as separate job. It means, that page which was
    created/updated/deleted can be copied immediately, but all other affected pages can be processed
    via copy job.
