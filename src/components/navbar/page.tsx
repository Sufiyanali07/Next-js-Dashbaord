import React from 'react'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,  } from "@radix-ui/react-navigation-menu";

function Navbar() {
  return (
    <div>
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <NavigationMenuLink href="#">Link 1</NavigationMenuLink>
                        <NavigationMenuLink href="#">Link 2</NavigationMenuLink>
                        <NavigationMenuLink href="#">Link 3</NavigationMenuLink>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
        
    </div>
  )
}

export default Navbar;