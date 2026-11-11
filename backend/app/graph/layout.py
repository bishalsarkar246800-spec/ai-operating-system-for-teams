from typing import Dict, Tuple
import networkx as nx


def compute_dag_layout(
    G: nx.DiGraph,
    x_gap: int = 340,
    y_gap: int = 160,
    start_x: int = 80,
    start_y: int = 80,
) -> Dict[str, Tuple[float, float]]:
    """
    Computes a clean hierarchical 2D layout for DAG nodes using topological generations.
    Nodes at depth 0 are placed in the first column, depth 1 in second column, etc.
    """
    positions: Dict[str, Tuple[float, float]] = {}

    if not G.nodes:
        return positions

    if not nx.is_directed_acyclic_graph(G):
        # Fallback grid layout if cycles exist
        row_size = 3
        for idx, node in enumerate(G.nodes):
            r = idx // row_size
            c = idx % row_size
            positions[node] = (float(start_x + c * x_gap), float(start_y + r * y_gap))
        return positions

    # Topological generations group nodes into parallel layers
    layers = list(nx.topological_generations(G))

    for col_idx, layer in enumerate(layers):
        layer_nodes = sorted(layer)
        layer_height = len(layer_nodes)
        
        # Center-align nodes in column
        y_offset = start_y
        for row_idx, node_id in enumerate(layer_nodes):
            x = start_x + col_idx * x_gap
            y = y_offset + row_idx * y_gap
            positions[node_id] = (float(x), float(y))

    return positions

