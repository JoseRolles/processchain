# ProcessChain
A JavaScript object that helps you manage multiple asyncronous calls. if you need to run multiple asyncronous calls (ie. XMLHttpRequest, AJAX, or IndexedDB) at the same time in no particular order and need a way to run another script or multiple scripts afterward, this object can help you.

# Usage Example
    <script>
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
        
        //start and execute the anonymous functions in the chain in order, respecting uncompleted flags and waits
        Chain.start();
    </script>



# ProcessChain Methods

    ProcessChain.push(handler, index, options);
This method pushes an anonymous function to be executed when the chain execution is started.
(Required) handler - An anonymous function that will be passed a currentProccess object.
(Optional) index - An integer index of where to insert the handler into the chain. A false boolean is passed by default denoting that the handler will be appended to the end of the chain. Please note that an integer longer than the current queue will cause the push to simply append the handler to the end of the queue.
(Optional) options - A JavaScript object that can be used to store information to this current push.

    ProcessChain.first(handler, index, options);
This is the same with ProcessChain.push method except that it resets the ProccessChain to the initial state before pushing the handler into the chain. This gurantees that the chain is empty if the chain has been used before. This is similar to executing ProcessChain.reset and then ProcessChain.push.

    ProcessChain.wait(index, options);
This method appends a wait to the process chain queue. Use this after a single or group of anonymous functions pushed that have uncompleted flags set and before subsequent anonymous functions that rely on the previous functions to complete. Only after all uncompleted flags from the functions before this wait in the chain have been cleared will the process continue on to the next function in the chain.
(Optional) index - An integer index of where to insert the wait into the chain. A false boolean is passed by default denoting that the handler will be appended to the end of the chain. Please note that an integer longer than the current queue will cause the wait to be simply appended to the end of the queue.
(Optional) options - A JavaScript object that can be used to store information to this current wait.

    ProcessChain.final(handler);
This method sets the final anonymous function that will be executed when all uncompleted flags set has been cleared.
(Required) handler - An anonymous function that will be passed the dataSore from the currentProcess object.

    ProcessChain.start();
This method starts and executes the anonymous functions in the chain in order, respecting uncompleted flags and waits.

    ProcessChain.stop();
This method stops the chain at whichever anonymous handler it is running. It can be restarted by calling the start method.

    ProcessChain.abort();
This method stops the chain and resets it to its initial empty state without calling the final function.

    ProcessChain.complete();
This method stops the chain at whichever anonymous handler it is running and then skips to and calls the final anonymous function. After the final function has been called, the chain resets itself to the initial empty state.


# currentProcess Properties

    currentProcess.dataStore
A place to save things that will persist until the final anonymous handler finishes running.

# currentProcess Methods

    currentProcess.uncompleted();
This method sets an uncompleted flag on the current anonymous function being pushed into the chain. Any subsequent waits in the chain will cause the chain to stop processing until this uncompleted flag and any others has been cleared before moving on to any of the functions after the wait. To clear the flag, call the completed method. Note that the final pushed anonymous function will also wait until all uncompleted flags are cleared.

    currentProcess.completed();
This method clears the uncompleted flag of the current anonymous function being pushed into the chain. See uncompleted method for more information.

    currentProcess.options();
This method returns the options of this current anonymous function set in the push method.

    currentProcess.chain.stop();
This method stops the chain at the current anonymous function. It can be restarted by calling the start method.

    currentProcess.chain.start();
This method resumes the execution of the process chain where it had left off when the stop method was called.

    currentProcess.chain.abort();
This method stops the chain and resets it to its initial empty state without calling the final function.

    currentProcess.chain.complete();
This method stops the chain and then skips to and calls the final anonymous function. After the final function has been called, the chain resets itself to the initial empty state.

