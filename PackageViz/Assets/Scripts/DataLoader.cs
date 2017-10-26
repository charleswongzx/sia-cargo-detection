using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;
using UnityEngine;
using LitJson;
using System.IO;
using UnityEngine.UI;

public class DataLoader : MonoBehaviour {

    private string jsonString;
    private JsonData itemData;
    public GameObject package;
    public int scaleModifier;
    public int positionModifier;
    public GameObject nextButton;
    public GameObject itemTemplate;
    public GameObject content;

    public List<GameObject> packageList = new List<GameObject>();
  
    // Use this for initialization
    void Start () {
        StartCoroutine(GetText());
   
    }
	
	// Update is called once per frame
	void Update () {
		
	}

    void LoadJson()
    {
        

        //jsonString = File.ReadAllText(Application.dataPath + "/Resources/data.json");
        //itemData = JsonMapper.ToObject(jsonString);

        // Number of Packages
        //Debug.Log(itemData["items"].Count);

        int noOfPackages = itemData["items"].Count;

        for (int i = 0; i < noOfPackages; i++)
        {
            //Initialize cube
            var cube = Instantiate(package);
            // Set Cube to invisible 
            cube.SetActive(false);

            // Dimensions
            float width = (float)(int)itemData["items"][i]["width"] / scaleModifier;
            float height = (float)(int)itemData["items"][i]["height"] / scaleModifier;
            float depth = (float)(int)itemData["items"][i]["depth"] / scaleModifier;
            cube.transform.localScale = new Vector3(width, height, depth);

            // Position 
            float xPosition = (float)(int)itemData["items"][i]["position"][0] / positionModifier;
            float yPosition = (float)(int)itemData["items"][i]["position"][1] / positionModifier;
            float zPosition = (float)(int)itemData["items"][i]["position"][2] / positionModifier;
            cube.transform.position = new Vector3(xPosition, yPosition, zPosition);

            packageList.Add(cube);

            // Create button 
            var copy = Instantiate(itemTemplate);
            copy.transform.parent = content.transform;
            copy.GetComponent<RectTransform>().localScale = Vector2.one;
            // Set Text Label
            //copy.GetComponentInChildren<Text>().text = (string)itemData["items"][i]["name"];

            // Format Text 
            Text[] textfields;
            textfields = copy.GetComponentsInChildren<Text>();

            textfields[0].text = "Package ID: " + (string)itemData["items"][i]["name"];
            textfields[1].text = "Fragile: "+ (itemData["items"][i]["fragile"]).ToString();
            textfields[2].text = "Rotatable: " + (itemData["items"][i]["rotatable"]).ToString();
            textfields[3].text = "Stackable: " + (itemData["items"][i]["stackable"]).ToString();
        }
    }

    public void ShowNext()
    {
       
        if (packageList.Count == 1)
        {
            nextButton.GetComponentInChildren<Text>().text = "DONE";
            packageList[0].SetActive(true);
            packageList.RemoveAt(0);
            Destroy(content.GetComponentInChildren<Button>().gameObject);
        }
        else if (packageList.Count != 0)
        {
            nextButton.GetComponentInChildren<Text>().text = "NEXT";
            packageList[0].SetActive(true);
            packageList.RemoveAt(0);
            Destroy(content.GetComponentInChildren<Button>().gameObject);
        }
    }

    public void Reset()
    {
        LoadJson();
    }

    // GET Request for data
    IEnumerator GetText()
    {
        using (UnityWebRequest www = UnityWebRequest.Get("https://svfjld11of.execute-api.ap-southeast-1.amazonaws.com/prod/cargo-management"))
        {
            yield return www.Send();

            if (www.isNetworkError || www.isHttpError)
            {
                Debug.Log(www.error);
            }
            else
            {
                // Show results as text
                Debug.Log(www.downloadHandler.text);
                itemData = JsonMapper.ToObject(www.downloadHandler.text);
                LoadJson();

                // Or retrieve results as binary data
                byte[] results = www.downloadHandler.data;
            }
        }
    }
}
