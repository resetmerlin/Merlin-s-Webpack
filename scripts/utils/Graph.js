class Graph {
  /**
   * Creates a new graph.
   */
  constructor() {
    /**
     * The adjacency list that represents the graph.
     * @type {Object<string, string[]>}
     */
    this.adjacencyList = {};
  }

  /**
   * Adds a new vertex to the graph.
   * If the vertex already exists, it does nothing.
   *
   * @param {string} vertex - The name of the vertex to add.
   */
  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }

  /**
   * Adds an edge between two vertices in the graph.
   * If the vertices do not exist, they are created.
   *
   * @param {string} source - The source vertex.
   * @param {string} destination - The destination vertex.
   */
  addEdge(source, destination) {
    if (!this.adjacencyList[source]) {
      this.addVertex(source);
    }
    if (!this.adjacencyList[destination]) {
      this.addVertex(destination);
    }
    this.adjacencyList[source].push(destination);
    this.adjacencyList[destination].push(source);
  }

  /**-
   * Removes an edge between two vertices in the graph.
   * If the edge does not exist, it does nothing.
   *
   * @param {string} source - The source vertex.
   * @param {string} destination - The destination vertex.
   */
  removeEdge(source, destination) {
    this.adjacencyList[source] = this.adjacencyList[source].filter(vertex => vertex !== destination);
    this.adjacencyList[destination] = this.adjacencyList[destination].filter(vertex => vertex !== source);
  }

  /**
   * Removes a vertex and all its edges from the graph.
   *
   * @param {string} vertex - The vertex to remove.
   */
  removeVertex(vertex) {
    while (this.adjacencyList[vertex]) {
      const adjacentVertex = this.adjacencyList[vertex].pop();
      this.removeEdge(vertex, adjacentVertex);
    }
    delete this.adjacencyList[vertex];
  }
}

module.exports = Graph;
