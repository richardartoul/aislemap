var aisleMap = new AisleMap();
aisleMap.constructGrid();
aisleMap.placeItems();
aisleMap.findAislesWithItems();
aisleMap.createPath();
renderAisleMap(aisleMap);