Feature: Layers

  Scenario: Visitor explores global and project-specific layers
    Given the fixture project page is open on the layers view
    Then the layers overlay is visible
    And the global layer "Community Wells" is visible
    And the project-specific layer "Canopy Plots" is visible
    When the visitor enables the landcover layer
    Then the current URL contains "layers-landcover=true"
    When the visitor enables the historical satellite layer
    Then the current URL contains a historical satellite month
    When the visitor enables the project-specific layer "Canopy Plots"
    Then the current URL contains "Canopy%20Plots"
