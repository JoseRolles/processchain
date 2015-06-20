# ProcessChain
A JavaScript object that helps you manage multiple asyncronous calls. if you need to run multiple asyncronous calls (ie. XMLHttpRequest, AJAX, or IndexedDB) at the same time in no particular order and need a way to run another script or multiple scripts afterward, this object can help you.

# Demo
    //Create a new ProcessChain object.
    var Chain = new ProcessChain();
    
    //push an anonymous function into the chain which gets passed a currentProcess object in the argument
    Chain.push(function(currentProcess)
    {
        //add some things to the dataStore
        currentProcess.dataStore.greeting = "Hello World";
        currentProcess.dataStore.greeted = false;
    });
    
    //push another anonymous function but this time set an uncompleted flag
    Chain.push(function(currentProcess)
    {
        //set uncompleted flag
        currentProcess.uncompleted();
        
        //a dummy async function
        setTimeout(function()
        {
            //print the message from the previous process
            console.log( "Delayed message: " + currentProcess.dataStore.greeting );
            //change greeted to true
            currentProcess.dataStore.greeted = true;
            
            //clear uncompleted flag
            currentProcess.completed();
        }, 3000);
    });
    
    //add another anonymous function that runs immediately after the previous one
    Chain.push(function(currentProcess)
    {
        //print if greeted yet
        console.log( currentProcess.dataStore.greeted ? "Yes, greeted" : "No, not yet greeted." );
    });
    
    //add a wait to the chain. This causes the chain to wait until all uncompleted flags from previous processes to clear
    Chain.wait();
    
    //add another anonymous function that runs after the wait is over
    Chain.push(function(currentProcess)
    {
        //print if greeted yet
        console.log( currentProcess.dataStore.greeted ? "Yes, greeted" : "No, not yet greeted." );
    });
    
    //add the final anonymous function that runs only when ALL uncompleted flags have cleared
    //this anonymous function will be passed the dataStore object
    Chain.final(function(dataStore)
    {
        //print
        console.log( "This is the final process. The ChainProcess will reset now to its initial state." );
    });
    
    //start and execute all the anonymous functions in the chain, respecting uncompleted flags and waits
    Chain.start();
    

# API

# ProcessChain Functions

    ProcessChain.push(handler, index, options);
This function pushes an anonymous function to be executed when the chain execution is started.
(Required) handler - An anonymous function that will be passed a currentProccess object.
(Optional) index - An integer index of where to insert the handler into the chain. A false boolean will be passed by default denoting that the handler will be appended to the end of the chain. Please note that an integer longer than the current queue will cause the push to simple append the handler.
(Optional) options - A JavaScript object that can be used to store information to this current push.

    ProcessChain.first(handler, index, options);
This is the same with ProcessChain.push except that it resets the ProccessChain to the initial state before pushing the handler into the chain. This gurantees that the chain is empty if the chain has been used before. This is similar to executing ProcessChain.reset and then ProcessChain.push.

    ProcessChain.wait();

    ProcessChain.final(handler);
    

# currentProcess Functions

    currentProcess.uncompleted();

    currentProcess.completed();

    currentProcess.options();

    currentProcess.chain.start();

    currentProcess.chain.stop();

    currentProcess.chain.abort();

    currentProcess.chain.complete();

