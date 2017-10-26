using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using LitJson;

public class GetJsonDataScript : MonoBehaviour
{
    private JsonData itemData1;
    void Start()
    {
        StartCoroutine(GetText());
    }

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
                //Debug.Log(www.downloadHandler.text);
                itemData1 = JsonMapper.ToObject(www.downloadHandler.text);
                //Debug.Log(itemData1["items"][0]["name"]);


                // Or retrieve results as binary data
                byte[] results = www.downloadHandler.data;
            }
        }
    }
}