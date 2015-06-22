function ProcessChain()
{
	this.queue; //Stores the order of pushed anonymous functions
	this.uncompleted; //Stores an array of uncompleted indexes of anonymous functions in the queue
	this.nextProcessToStart; //Stores index of next queue item to run

	this.finalHandler; //Final handler to run after all uncompleted flags have been cleared

	this.dataStore; //A place to store persistent data from one anonymous function to the next

	this.run; //Keeps track of whether start or stop have been called
	this.timeoutId; //Keeps the most recent timeoutID set by the loop

	this.startTime; //Time when process starts

	this.reset(); //Initialize

	//Static variables
	this.timeoutDuration = 100; //How often should we check if uncompleted flag has cleared if Asyncronous functions called
}
ProcessChain.prototype.reset = function()
{
	this.clearLoop(); //Clear loop if any;

	this.queue = [];
	this.uncompleted = [];
	this.nextProcessToStart = 0;

	this.finalHandler = function(){};

	this.dataStore = {};

	this.run = false;
	this.timeoutId = false;

	this.startTime = false;
}
ProcessChain.prototype.first = function(handler, options, index)
{
	//Same as push method
	this.reset();
	this.push(handler, options, index);
}
ProcessChain.prototype.push = function(handler, options, index)
{
	//Add a handler to the queue. Options and index are optional.
	if (typeof handler == "function")
	{
		if (typeof index == "number" && index >= 0 && index < this.queue.length)
		{
			this.queue.splice(index, 0,
			{
				type: "process",
				handler: handler,
				options: options ? options : {},
				called: false,
			});
		}
		else
		{
			this.queue.push(
			{
				type: "process",
				handler: handler,
				options: options ? options : {},
				called: false,
			});
		}
	}
	else
	{
		throw 'Handler is not a function.';
	}
}
ProcessChain.prototype.wait = function(options, index)
{
	//Add a wait to the queue. All uncompleted flags set before this wait must be cleared before the process chain can move on.
	if (typeof index == "number" && index >= 0 && index < this.queue.length)
	{
		this.queue.splice(index, 0, 
		{
			type:"wait",
			options: options ? options : {}
		});
	}
	else
	{
		this.queue.push(
		{
			type:"wait",
			options: options ? options : {}
		});
	}
}
ProcessChain.prototype.final = function(handler)
{
	//Set the final handler to be called after all uncompleted flags have been cleared.
	if (typeof handler == "function")
	{
		this.finalHandler = handler;
	}
}
ProcessChain.prototype.start = function()
{
	//Start the process chain. After pushing all anonymous functions, call this to start the chain.
	this.startTime = new Date().getTime();
	this.stop();
	this.run = true;
	this.loop();
}
ProcessChain.prototype.stop = function()
{
	//Stop the process chain prematurely. To resume, call start again.
	this.run = false;
	this.clearLoop();
}
ProcessChain.prototype.abort = function()
{
	//Stop the process chain prematurely and reset the chain to its initial state.
	this.stop();
	this.reset();
}
ProcessChain.prototype.complete = function()
{
	//Stop the process chain now, call the final handler, and reset the chain to its initial state.
	this.stop();
	this.finalHandler(this.dataStore);
	this.reset();
}
ProcessChain.prototype.clearLoop = function()
{
	//Clear loop if any
	if (this.timeoutId !== false)
	{
		clearTimeout(this.timeoutId);
		this.timeoutId = false;
	}
}
ProcessChain.prototype.loop = function()
{
	//Start loop. This will run the handlers in the queue from index 0. If it encounters a wait or the it gets to the end of the queue, it will make sure all uncompleted flags have been cleared before moving on.
	if (this.run)
	{
		var self = this;
		this.timeoutId = setTimeout(
		function()
		{
			if (self.run)
			{
				if (self.nextProcessToStart == self.queue.length)
				{
					//We are now at the end of the queue, so check if we still have uncompleted flags.
					if (self.uncompleted.length === 0)
					{
						//End case: all uncompleted flags have been cleared.
						self.complete();
					}
					else
					{
						//Some uncompleted flags left. Loop again.
						self.loop();
					}
				}
				else if (self.nextProcessToStart < self.queue.length)
				{
					//We are not at the end yet
					while (self.run && self.nextProcessToStart < self.queue.length && (self.uncompleted.length === 0 || self.queue[self.nextProcessToStart].type != "wait"))
					{
						//While no uncompleted flags or while next is not a wait
						if (self.queue[self.nextProcessToStart].type == "process" && !self.queue[self.nextProcessToStart].called)
						{
							//Run
							self.queue[self.nextProcessToStart].called = true; //Set to called status to true so we don't run again later

							//Run callback and pass in currentProcess object
							self.queue[self.nextProcessToStart].handler(
							{
								index: (function(index){return index;})(self.nextProcessToStart),
								dataStore: self.dataStore,
								chain:
								{
									stop: function() //Stops the chain
									{
										self.stop();
									},
									start: function() //Restarts the chain
									{
										self.start();
									},
									abort: function() //Stops the chain and reset chain to its initial state
									{
										self.abort();
									},
									complete: function() //Stops the chain and call the final handler
									{
										self.complete();
									}
								},
								uncompleted: (function(index) //Set uncompleted flag for this anonymous function
								{
									return (function()
									{
										self.uncompleted.push(index);
									});
								})(self.nextProcessToStart),
								completed: (function(index) //Clear uncompleted flag for this anonymous function
								{
									return (function()
									{
										self.uncompleted.splice(self.uncompleted.indexOf(index), 1);
									});
								})(self.nextProcessToStart),
								options: (function(index) //Get the options for this anonymous function set on push
								{
									return (function()
									{
										return self.queue[index].options;
									});
								})(self.nextProcessToStart)
							});
						}
						//After calling handler and stop has not been called, increment to next in the queue.
						if (self.run)
						{
							self.nextProcessToStart++;
						}
					} //End of while loop.
					//Recursion: end of while loop so we will call itself again to check again after timeout.
					self.loop();
				}
				else
				{
					//Failure, the pointer has gone beyond the last item in the queue
					self.abort();
					throw 'Current pointer out of bounds.';
				}
			}
		}, this.timeoutDuration);
	}
}
