Feature: Failure and empty states

  Scenario: Project info fails to load
    Given the fixture project page is open with a failing project info endpoint
    Then the project error state is visible

  Scenario: Community members fail to load
    Given the fixture project page is open on the community view with a failing members endpoint
    Then the community error state is visible

  Scenario: Biodiversity observations fail to load
    Given the fixture project page is open on the biodiversity observations view with a failing measured trees endpoint
    Then the biodiversity observations error state is visible

  Scenario: Biodiversity predictions fail to load
    Given the fixture project page is open on the biodiversity predictions view with a failing predictions endpoint
    Then the biodiversity predictions error state is visible

  Scenario: Search returns no results
    Given the homepage is open
    When the visitor searches for "zzznoresultsxyz"
    Then the search empty state is visible
