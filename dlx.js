
/*
  Implementation of Algorithm X using the Dancing Links technique
  to solve sudoku problems.
  
  http://en.wikipedia.org/wiki/Algorithm_X
  http://en.wikipedia.org/wiki/Dancing_Links
  
  ---

  Copyright 2011 Eric Cote
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

DLX = function(cases) {
    if (DLX.valid(cases)) {
	this.root = null;
	this.resolved = false;
	this.sudoku = new Array( cases.length );
	for (var i=0; i < cases.length; ++i) {
	    this.sudoku[i] = new Array( cases[i].length );
	    for(var j = 0; j < cases[i].length; ++j) {
		this.sudoku[i][j] = cases[i][j];
	    }
	}
	this.length = cases.length;
	this.nbPossibilities = this.length * this.length;
	this.solutions = new Array();
    }
}

DLX.Node = function() {
    this.index = -1;
    this.header = null;
    this.left = null;
    this.right = null;
    this.up = null;
    this.down = null;
}

// ***************
// -. Dancing Links methods
DLX.prototype.cover = function(colNode) {
    colNode.right.left = colNode.left;
    colNode.left.right = colNode.right;
    for (var rowNode = colNode.down; rowNode !== colNode; rowNode = rowNode.down) {
	for (var rightNode = rowNode.right; rightNode !== rowNode; rightNode = rightNode.right) {
	    rightNode.up.down = rightNode.down;
	    rightNode.down.up = rightNode.up;
	}
    }
};

DLX.prototype.uncover = function(colNode) {
    for (var rowNode = colNode.up; rowNode !== colNode; rowNode = rowNode.up) {
	for (var leftNode = rowNode.left; leftNode !== rowNode; leftNode = leftNode.left) {
	    leftNode.up.down = leftNode;
	    leftNode.down.up = leftNode;
	}
    }
    colNode.right.left = colNode;
    colNode.left.right = colNode;
};

DLX.prototype.search = function() {
    if (this.root.right === this.root && this.root.left === this.root) {
	this.resolveSolutions();
	this.resolved = true;
	return;
    }
    var col = this.root.right;
    this.cover(col);
    for (var rowNode = col.down; rowNode !== col && !this.resolved; rowNode = rowNode.down) {
	this.solutions.push( rowNode );
	for (var rightNode = rowNode.right; rightNode !== rowNode; rightNode = rightNode.right) {
	    this.cover(rightNode.header);
	}
	this.search();
	if (this.resolved) return;
	for (var rightNode = rowNode.right; rightNode !== rowNode; rightNode = rightNode.right) {
	    this.uncover(rightNode.header);
	}
	this.solutions.pop();
    }
    this.uncover(col);
};

DLX.prototype.initSolutions = function(rowHeader) {
    for (var a = 0; a < this.length; ++a) {
	for (var b = 0; b < this.length; ++b) {
	    var i = this.sudoku[a][b];
	    if(i >= 1 && i <= this.length) {
		var index = (a * this.nbPossibilities) + (b * this.length) + (i - 1);
		var row = rowHeader[ index ];
		this.addInitSolution( row );
	    }
	}
    }
};

DLX.prototype.addInitSolution = function(row) {
    this.solutions.push( row );
    this.cover( row.header );
    for (var rightNode = row.right; rightNode !== row; rightNode = rightNode.right) { 
	this.cover( rightNode.header );
    }
};

DLX.prototype.getBox = function(row, col) {
    var n = Math.sqrt( this.length );
    var x = Math.ceil((row + 1) / n);
    var y = Math.ceil((col + 1) / n);
    var box = ((y - 1) * n) + x - 1;
    return (box * this.length);
};
DLX.prototype.getColumn = function(i) {
    return parseInt(i / this.length) % this.length;
};
DLX.prototype.getNumber = function(i) {
    return i % this.length;
};
DLX.prototype.getRow = function(i) { 
    return parseInt(i / this.nbPossibilities);
};

// ********************************/
/* Build toroidal linklist matrix */
DLX.prototype.initMatrix = function() {
    var nbCol = this.nbPossibilities * 4; // 4 constraints
    var nbRow = (this.nbPossibilities * this.length) + 1; // + 1 for header
    var rowHeader = new Array(nbRow);
    var colHeaders = new Array(nbCol);
    var first = new DLX.Node(), last = first;
    colHeaders[0] = first;
    for(var i = 1; i < nbCol; i++) {
	var node = new DLX.Node();
	node.left = last;
	last.right = node;
	last = node;
	colHeaders[i] = node;
    }
    this.root = new DLX.Node(); // init root
    last.right = this.root;
    this.root.left = last;
    this.root.right = first;
    first.left = this.root;

    var insertNode = function(index, node) {
	var header = colHeaders[index];
	if (!header.down) { 
	    header.down = node;
	    node.up = header; 
	} else {
	    node.up = header.up;
	    header.up.down = node;
	}
	node.down = header;
	header.up = node;
	node.header = header;
    }
    for (var i = 0; i < (nbRow - 1); i++) {
	var number = this.getNumber( i );
	var col = this.getColumn( i );
	var row = this.getRow( i );
	var pos = row * this.length;
	
	var indN1 = (col * this.length) + number;  //  1: Only 1 per square
	var indN2 = this.nbPossibilities + pos + col; //  2: Only 1 of per number per Row
	var indN3 = (this.nbPossibilities * 2) + pos + number; //  3: Only 1 of per number per column
	var indN4 = (this.nbPossibilities * 3) + this.getBox( row, col ) + number; //  4: Only 1 of per number per Box
	
	var n1 = new DLX.Node(), n2 = new DLX.Node(), n3 = new DLX.Node(), n4 = new DLX.Node();
	n1.right = n2; n2.right = n3; n3.right = n4; n4.right = n1;
	n1.left = n4; n2.left = n1; n3.left = n2; n4.left = n3;
	n1.index=i; n2.index=i; n3.index=i; n4.index=i;
	
	insertNode(indN1, n1);
	insertNode(indN2, n2);
	insertNode(indN3, n3);
	insertNode(indN4, n4);

	rowHeader[i] = n4;
    }
    this.initSolutions(rowHeader);
};

DLX.prototype.resolveSolutions = function() {
    for (var i=0;i<this.solutions.length;++i) {
	var n = this.solutions[i];
	this.sudoku[ this.getRow(n.index) ][ this.getColumn(n.index) ] = this.getNumber(n.index) + 1;
    }
};

/* Valider la solution initiale */
DLX.valid = function(cases) {
    var n = Math.sqrt(cases.length);
    if ((n * n) !== cases.length) { // check first it's a valid square
	return false;
    }
    for(var i=0;i < cases.length;++i) { 
	var row = cases[i];
	if (row.length !== cases.length) { // check all rows length
	    return false;
	}
    }
    // check rows and columns
    for(var i=0;i<cases.length;++i) {
	for(var j=0;j<cases[i].length;++j) {
	    if (cases[i][j] !== 0) {
		if (cases[i][j] < 1 || cases[i][j] > cases.length) {
		    return false;
		}
		for(var k=j+1;k<cases.length;++k) {
		    if (cases[i][j] === cases[i][k]) { // check row
			return false;
		    }
		}
		for(var k=i+1;k<cases.length;++k) {
		    if (cases[i][j] === cases[k][j]) { // check column
			return false;
		    }
		}
	    }
	}
    }
    // check boxes
    var boxes = DLX.sudokuBoxes(cases);
    for(var i = 0; i < boxes.length; ++i) {
	var numbers = boxes[i];
	for(var j = 0; j < numbers.length; ++j) {
	    if (numbers[j] > 0) {
		for(var k = j+1; k<numbers.length;++k) {
		    if (numbers[j] === numbers[k]) { // check box
			return false;
		    }
		}
	    }
	}
    }
    return true;
};

/* Numbers in each box */
DLX.sudokuBoxes = function(sudoku) {
    var n = Math.sqrt(sudoku.length);
    var boxes = new Array(sudoku.length);
    for(var i=0;i<boxes.length;++i) {
	boxes[i] = new Array(sudoku.length);
    }
    for(var i = 0; i < sudoku.length;++i) {
	for(var j = 0; j < sudoku[i].length;++j) {
	    boxes[(Math.floor(i/n) * n) + Math.floor(j/n)][((i % n) * n) + (j % n)] = sudoku[i][j];
	}
    }
    return boxes;
};

DLX.prototype.solve = function() {
    if (!this.sudoku)
	return null;
    this.initMatrix();
    this.search();
    this.root = null; // help the garbage collector
    return this.sudoku;
};