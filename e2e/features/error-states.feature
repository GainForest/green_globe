Feature: Error states

  Scenario: Project info fails to load
    Given the fixture project page is open with a failing project info endpoint
    Then the project error message is visible

  Scenario: Community members fail to load
    Given the fixture project page is open on the community view with a failing members endpoint
    Then the community error message is visible

  Scenario: Biodiversity observations fail to load
    Given the fixture project page is open on the biodiversity observations view with a failing measured trees endpoint
    Then the biodiversity error message is visible

  Scenario: Search returns no results
    Given the homepage is open
    When the visitor searches for "zzznoresultsxyz"
    Then the search empty state is visible
