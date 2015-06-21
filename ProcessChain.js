function ProcessChain()
{
	this.queue;
	this.uncompleted; //stores an array of uncompleted indexes
	this.nextProcessToStart; //stores index of next queue item

	this.finalHandler; //final handler

	this.dataStore; //place to store data and passed to all handlers on run

	this.run;
	this.timeoutId;

	this.startTime;
	this.timeout;

	this.reset();

	//static
	this.timeoutDuration = 100;
}
ProcessChain.prototype.reset = function()
{
	this.clearLoop(); //if any

	this.queue = [];
	this.uncompleted = [];
	this.nextProcessToStart = 0;

	this.finalHandler = function(){};

	this.dataStore = {};

	this.run = false;
	this.timeoutId = false;

	this.startTime = false;
	this.timeout = false;
}
ProcessChain.prototype.first = function(handler, options, index)
{
	this.reset();
	this.push(handler, options, index);
}
ProcessChain.prototype.push = function(handler, options, index)
{
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
	if (typeof handler == "function")
	{
		this.finalHandler = handler;
	}
}
ProcessChain.prototype.start = function()
{
	this.startTime = new Date().getTime();
	this.stop();
	this.run = true;
	this.loop();
}
ProcessChain.prototype.stop = function() //stops and allows continuing
{
	this.run = false;
	this.clearLoop();
}
ProcessChain.prototype.abort = function() //does not call final handler, chain is reset
{
	this.stop();
	this.reset();
}
ProcessChain.prototype.complete = function() //calls final handler, chain is reset
{
	this.stop();
	this.finalHandler(this.dataStore);
	this.reset();
}
ProcessChain.prototype.clearLoop = function()
{
	if (this.timeoutId !== false)
	{
		clearTimeout(this.timeoutId);
		this.timeoutId = false;
	}
}
ProcessChain.prototype.loop = function()
{
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
					if (self.uncompleted.length === 0)
					{
						//end case
						self.complete();
					}
					else
					{
						self.loop();
					}
				}
				else if (self.nextProcessToStart < self.queue.length)
				{
					//within bounds
					while (self.run && self.nextProcessToStart < self.queue.length && (self.uncompleted.length === 0 || self.queue[self.nextProcessToStart].type != "wait"))
					{
						//all finished or next is not wait
						if (self.queue[self.nextProcessToStart].type == "process" && !self.queue[self.nextProcessToStart].called)
						{
							//run
							self.queue[self.nextProcessToStart].called = true; //so we don't run again later

							//callback and pass in currentProcess object
							self.queue[self.nextProcessToStart].handler(
							{
								index: (function(index){return index;})(self.nextProcessToStart),
								dataStore: self.dataStore,
								chain:
								{
									start: function()
									{
										self.start();
									},
									stop: function()
									{
										self.stop();
									},
									abort: function()
									{
										self.abort();
									},
									complete: function()
									{
										self.complete();
									}
								},
								uncompleted: (function(index)
								{
									return (function()
									{
										self.uncompleted.push(index);
									});
								})(self.nextProcessToStart),
								completed: (function(index)
								{
									return (function()
									{
										self.uncompleted.splice(self.uncompleted.indexOf(index), 1);
									});
								})(self.nextProcessToStart),
								options: (function(index)
								{
									return (function()
									{
										return self.queue[index].options;
									});
								})(self.nextProcessToStart)
							});
						}
						if (self.run)
						{
							//advance only if still running, otherwise the following can move a pointer just reset to 0
							self.nextProcessToStart++;
						}
					}
					//recursive
					self.loop();
				}
				else
				{
					//failed
					self.abort();
					throw 'Current pointer out of bounds.';
				}
			}
		}, this.timeoutDuration);
	}
}
