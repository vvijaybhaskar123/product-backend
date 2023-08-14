
const expres=require('express')
const router=expres.Router()
const axios = require('axios'); 
const Records=require('./Model')

async function fetching(){
   
    const fetch = await import('node-fetch');
    const response= await fetch.default("https://s3.amazonaws.com/roxiler.com/product_transaction.json")
    
   const data= await response.json()
   for(let i=0;i<data.length;i++){
    
    const insertData= new Records({
         id:data[i].id,
         title:data[i].title,
         price:data[i].price,
         description:data[i].description,
         category:data[i].category,
         image:data[i].image,
        sold:data[i].sold,
        dateOfSale:data[i].dateOfSale

     })

     insertData.save()
   }
    
}
fetching()


router.get('/searchparameters', async (req, res) => {
  try {
    const starting = parseInt(req.query.starting);
    const ending = parseInt(req.query.ending);
    const searchText = req.query.searchText;
    const selectedMonth = req.query.selectedMonth;
    console.log(ending)

    const year = new Date().getFullYear();
    const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth() + 1;

    let aggregationPipeline = [
      {
        $match: {
          dateOfSale: {
            $regex: `-${monthNumber < 10 ? '0' + monthNumber : monthNumber}-`
          }
        }
      },
    ]

      const count=await Records.countDocuments(aggregationPipeline[0].$match)
      console.log(count)

      if(ending<count || starting>0)
     aggregationPipeline.push(...[
      {
        $sort: { _id: 1 }
      },
      {
        $skip: starting - 1
      },
      {
        $limit: ending - starting + 1
      }
    ])
    

    if (searchText) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { title: { $regex: searchText, $options: 'i' } },
            { description: { $regex: searchText, $options: 'i' } },
            { price: parseFloat(searchText)}
          ]

        },
        
      });
    }

    const data = await Records.aggregate(aggregationPipeline);

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/',async(req,res)=>{

  const selectedMonth = req.query.selectedMonth;
  const year = new Date().getFullYear();
  const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth() + 1;

  let aggregationPipeline = [
    {
      $match: {
        dateOfSale: {
          $regex: `-${monthNumber < 10 ? '0' + monthNumber : monthNumber}-`
        }
      }
    },
    {
      $group:{
        _id:null,
        totalsale:{$sum:"$price"},
        solditems:{$sum:{$cond:[{$eq:["$sold" ,true]},1,0]}},
        notsolditems:{$sum:{$cond:[{$eq:["$sold" ,false]},1,0]}}
      }

    },
    {
      $project:{
        _id: 0,
        totalsale:1,
        solditems:1,
        notsolditems:1
      }
    }
  ];
  const data = await Records.aggregate(aggregationPipeline)
  res.json(data)
})
router.get('/bar-chart', async (req, res) => {
  try {
    const selectedMonth = req.query.selectedMonth;
    const year = new Date().getFullYear();
    const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth() + 1;

    const aggregationPipeline = [
      {
        $match: {
          dateOfSale: {
            $regex: `-${monthNumber < 10 ? '0' + monthNumber : monthNumber}-`,
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$price', 100] }, then: '0 - 100' },
                { case: { $lte: ['$price', 200] }, then: '101 - 200' },
                { case: { $lte: ['$price', 300] }, then: '201 - 300' },
                { case: { $lte: ['$price', 400] }, then: '301 - 400' },
                { case: { $lte: ['$price', 500] }, then: '401 - 500' },
                { case: { $lte: ['$price', 600] }, then: '501 - 600' },
                { case: { $lte: ['$price', 700] }, then: '601 - 700' },
                { case: { $lte: ['$price', 800] }, then: '701 - 800' },
                { case: { $lte: ['$price', 900] }, then: '801 - 900' },
              ],
              default: '901 - above',
            },
          },
          count: { $sum: 1 },
        },
      },
    ];

    const data = await Records.aggregate(aggregationPipeline);
    res.json(data);
    console.log(data)
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/pie-chart', async (req, res) => {
  try {
    const selectedMonth = req.query.selectedMonth;
    const year = new Date().getFullYear();
    const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth() + 1;

    const aggregationPipeline = [
      {
        $match: {
          dateOfSale: {
            $regex: `-${monthNumber < 10 ? '0' + monthNumber : monthNumber}-`,
          },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ];

    const data = await Records.aggregate(aggregationPipeline);
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});





router.get('/combined-data', async (req, res) => {
  try {
    const selectedMonth = req.query.selectedMonth;

   
    const transactionsResponse = await axios.get('http://localhost:5000/transactions', {
      params: {
        selectedMonth: selectedMonth,
      },
    });
    const transactions = transactionsResponse.data;

 
    const statisticsResponse = await axios.get('http://localhost:5000/statistics', {
      params: {
        selectedMonth: selectedMonth,
      },
    });
    const statistics = statisticsResponse.data;

   
    const barChartResponse = await axios.get('http://localhost:5000/bar-chart', {
      params: {
        selectedMonth: selectedMonth,
      },
    });
    const barChart = barChartResponse.data;

  
    const pieChartResponse = await axios.get('http://localhost:5000/pie-chart', {
      params: {
        selectedMonth: selectedMonth,
      },
    });
    const pieChart = pieChartResponse.data;

    const combinedData = {
      transactions,
      statistics,
      barChart,
      pieChart,
    };

    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});




module.exports=router