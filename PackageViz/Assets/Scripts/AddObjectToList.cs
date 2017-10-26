using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AddObjectToList : MonoBehaviour {

    public GameObject itemTemplate;
    public GameObject content;

    public void AddButton_Click()
    {
        var copy = Instantiate(itemTemplate);
        copy.transform.parent = content.transform;
        copy.GetComponent<RectTransform>().localScale = Vector2.one;
    }
}
